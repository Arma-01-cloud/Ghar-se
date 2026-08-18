import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { get10DigitPhone } from './authService';
import { broadcastOrderToRidersInSupabase } from '../rider/services/notificationService';

const STORAGE_BUCKET = 'grocery-orders';

/**
 * Uploads a compressed grocery order image to Supabase Storage if bucket is configured
 *
 * @param {Blob|File} compressedBlob The compressed image blob
 * @param {string} customerPhone Customer phone or unique identifier
 * @param {string} orderId Unique order ID (e.g. GS-12345)
 * @returns {Promise<{ success: boolean, imageUrl: string, imagePath: string, error?: string }>}
 */
export async function uploadGroceryOrderImage(compressedBlob, customerPhone, orderId) {
  if (!compressedBlob) {
    return { success: false, imageUrl: '', imagePath: '', error: 'No image provided for upload.' };
  }

  const cleanPhone = get10DigitPhone(customerPhone) || 'customer';
  const extension = compressedBlob.type === 'image/webp' ? 'webp' : 'jpg';
  const filePath = `${cleanPhone}/${orderId}.${extension}`;

  if (!isSupabaseConfigured) {
    return { success: false, imageUrl: '', imagePath: filePath, error: 'Supabase is not configured.' };
  }

  try {
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, compressedBlob, {
        contentType: compressedBlob.type || 'image/webp',
        upsert: true
      });

    if (uploadErr) {
      return {
        success: false,
        imageUrl: '',
        imagePath: filePath,
        error: uploadErr.message
      };
    }

    const { data: pubData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    const publicUrl = pubData?.publicUrl || '';

    return {
      success: true,
      imageUrl: publicUrl,
      imagePath: filePath
    };
  } catch (err) {
    return {
      success: false,
      imageUrl: '',
      imagePath: filePath,
      error: err.message
    };
  }
}

/**
 * Builds the official Shopkeeper WhatsApp notification text for Grocery Image Orders
 */
export function generateGroceryImageWhatsAppMessage({
  shopkeeperPhone,
  customerName,
  customerPhone,
  orderId
}) {
  const cleanDigits = get10DigitPhone(shopkeeperPhone);

  if (!cleanDigits || cleanDigits.length !== 10) {
    return {
      whatsappUrl: '',
      hasWhatsApp: false,
      error: 'This shopkeeper has not registered a WhatsApp number.'
    };
  }

  const targetPhone = `91${cleanDigits}`;
  const displayCustName = (customerName && customerName.trim() && customerName !== 'Customer') ? customerName.trim() : (customerPhone ? `Customer (${customerPhone})` : 'Customer');
  const displayCustPhone = customerPhone || 'Not provided';

  const messageText = 
`🛒 *New GharSee Order*

A new grocery image order has been received.

*Customer:*
${displayCustName}

*Phone:*
${displayCustPhone}

*Order ID:*
#${orderId}

Please open your GharSee Partner dashboard to view and process the order.`;

  const encodedMessage = encodeURIComponent(messageText);

  return {
    whatsappUrl: `https://wa.me/${targetPhone}?text=${encodedMessage}`,
    whatsappMessage: messageText,
    targetPhone,
    hasWhatsApp: true
  };
}

/**
 * Creates a Direct Grocery Image Order in Supabase and prepares the shopkeeper WhatsApp notification
 *
 * @param {Object} params
 * @param {Object} params.store Selected store object (with id, name, phone)
 * @param {string} params.customerName Customer full name
 * @param {string} params.customerPhone Customer mobile number
 * @param {string} params.deliveryAddress Delivery address
 * @param {number} params.quantity Number of list photos / quantity (default 1)
 * @param {string} params.note Optional customer note
 * @param {Blob|File} params.compressedBlob The client-side compressed image
 * @param {string} [params.previewDataUrl] Real uploaded image Data URL
 * @returns {Promise<Object>} Result with order record, whatsappUrl, and status
 */
export async function createDirectImageOrder({
  store,
  customerName,
  customerPhone,
  deliveryAddress,
  quantity = 1,
  note = '',
  compressedBlob,
  previewDataUrl = ''
}) {
  // 1. Validation: Store selection
  if (!store || !store.id) {
    return {
      success: false,
      error: 'Please select a store to place your grocery image order.'
    };
  }

  // 2. Validation: Image selection (Must be a real image)
  if (!compressedBlob && !previewDataUrl) {
    return {
      success: false,
      error: 'Please select a real photo of your grocery list.'
    };
  }

  // 3. Normalize Customer details from Supabase/Auth/Storage
  let finalCustPhone = customerPhone || '';
  let finalCustName = customerName || '';
  let finalAddress = deliveryAddress || '';

  try {
    if (!finalCustPhone) finalCustPhone = localStorage.getItem('gharsee_customer_phone') || '';
    if (!finalCustName) finalCustName = localStorage.getItem('gharsee_customer_name') || '';
    if (!finalAddress) {
      const savedLoc = JSON.parse(localStorage.getItem('gharsee_current_location') || '{}');
      finalAddress = savedLoc.formattedAddress || savedLoc.name || 'Doorstep Delivery';
    }
  } catch (e) {}

  const cleanCustDigits = get10DigitPhone(finalCustPhone);
  const formattedCustPhone = cleanCustDigits ? `+91 ${cleanCustDigits}` : (finalCustPhone || 'Not provided');
  const formattedCustName = (finalCustName && finalCustName !== 'Customer') ? finalCustName : 'Customer';

  // 4. Generate Unique Order ID (Format: GS-XXXXX)
  const orderId = `GS-${Math.floor(10000 + Math.random() * 90000)}`;

  // 5. Query REAL Store and Shopkeeper WhatsApp Number from Supabase `shops` table
  let realStoreName = store.name || 'Local Grocery Store';
  let realShopkeeperPhone = store.phone || store.shopkeeperPhone || store.shopkeeper_phone || null;

  if (isSupabaseConfigured && store.id) {
    try {
      const { data: shopRow } = await supabase
        .from('shops')
        .select('*')
        .eq('id', store.id)
        .maybeSingle();

      if (shopRow) {
        realStoreName = shopRow.name || realStoreName;
        realShopkeeperPhone = shopRow.phone || shopRow.shopkeeper_phone || shopRow.owner_phone || realShopkeeperPhone;
      }
    } catch (err) {
      console.warn('Error querying store from Supabase:', err);
    }
  }

  // 6. Guarantee REAL Customer Uploaded Image is Captured (NO Mock Images)
  let finalImageUrl = previewDataUrl || '';
  let finalImagePath = `${cleanCustDigits || 'cust'}/${orderId}.webp`;

  // Try reading compressedBlob into Data URL if previewDataUrl was not passed
  if (!finalImageUrl && compressedBlob && typeof FileReader !== 'undefined') {
    try {
      finalImageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(compressedBlob);
      });
    } catch (readErr) {
      console.warn('FileReader notice:', readErr);
    }
  }

  // Attempt upload to Supabase Storage if configured (without blocking)
  if (compressedBlob) {
    try {
      const uploadResult = await uploadGroceryOrderImage(compressedBlob, finalCustPhone, orderId);
      if (uploadResult && uploadResult.success && uploadResult.imageUrl) {
        finalImageUrl = uploadResult.imageUrl;
        finalImagePath = uploadResult.imagePath || finalImagePath;
      }
    } catch (uploadErr) {
      console.warn('Supabase storage upload bypassed, using real customer image data:', uploadErr);
    }
  }

  if (!finalImageUrl) {
    return {
      success: false,
      error: 'Unable to process the uploaded photo. Please select the image again.'
    };
  }

  // 7. Assemble Order items payload with the REAL customer photo
  const orderItemsPayload = [
    {
      id: `img-item-${orderId}`,
      name: `Grocery Image List (${quantity})`,
      quantity: Number(quantity) || 1,
      qty: Number(quantity) || 1,
      unit: 'image order',
      price: 0,
      note: (note || '').trim(),
      image: finalImageUrl,
      image_url: finalImageUrl,
      image_path: finalImagePath,
      isDirectImageOrder: true,
      isManual: true
    }
  ];

  const orderPayload = {
    id: orderId,
    store_id: store.id,
    store_name: realStoreName,
    customer_name: formattedCustName,
    customer_phone: formattedCustPhone,
    delivery_address: finalAddress || 'Doorstep Delivery',
    fulfillment_mode: 'store_selected',
    status: 'pending',
    subtotal: 0,
    delivery_fee: 0,
    discount: 0,
    total_amount: 0,
    payment_method: 'Pay on Delivery / After Inspection',
    payment_status: 'Pending',
    items: orderItemsPayload
  };

  // 8. Insert Order into Supabase `orders` table
  let insertedOrder = null;
  if (isSupabaseConfigured) {
    try {
      const { data: dbOrder, error: dbErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (dbErr) {
        console.error('Supabase image order insert notice:', dbErr.message);
      } else {
        insertedOrder = dbOrder;
      }

      // Also insert row into `order_items` table
      try {
        await supabase.from('order_items').insert([{
          order_id: orderId,
          product_name: `Grocery Image List (${quantity})`,
          quantity: Number(quantity) || 1,
          price: 0,
          unit: 'image order',
          replacement_preference: 'replace_brand'
        }]);
      } catch (itemErr) {
        console.warn('Supabase order_items insert notice:', itemErr);
      }
    } catch (err) {
      console.error('Exception inserting image order in Supabase:', err);
    }
  }

  const finalOrderRecord = insertedOrder || {
    ...orderPayload,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
    deliveryAddress: finalAddress,
    address: finalAddress
  };

  // 9. Persist Order to local customer storage for immediate synchronization
  try {
    const existingRaw = localStorage.getItem('gharsee_customer_orders');
    const existingOrders = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [finalOrderRecord, ...existingOrders.filter(o => o.id !== orderId)];
    localStorage.setItem('gharsee_customer_orders', JSON.stringify(updated));
  } catch (e) {}

  // 10. Broadcast Order to Riders asynchronously
  if (typeof broadcastOrderToRidersInSupabase === 'function') {
    broadcastOrderToRidersInSupabase(finalOrderRecord).catch(rErr => {
      console.warn('Rider notification notice:', rErr);
    });
  }

  // 11. Generate WhatsApp Notification URL for the REAL Shopkeeper
  const whatsappInfo = generateGroceryImageWhatsAppMessage({
    shopkeeperPhone: realShopkeeperPhone,
    customerName: formattedCustName,
    customerPhone: formattedCustPhone,
    orderId
  });

  return {
    success: true,
    order: finalOrderRecord,
    orderId,
    imageUrl: finalImageUrl,
    imagePath: finalImagePath,
    shopkeeperPhone: realShopkeeperPhone,
    hasWhatsApp: whatsappInfo.hasWhatsApp,
    whatsappUrl: whatsappInfo.whatsappUrl,
    whatsappMessage: whatsappInfo.whatsappMessage,
    whatsappError: whatsappInfo.error || null
  };
}
