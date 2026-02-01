import axios from 'axios';

const API_URL = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Products
export const getProducts = async (params = {}) => {
  const { data } = await axios.get(`${API_URL}/products`, {
    params,
    headers: getAuthHeader()
  });
  return data;
};

export const getProduct = async (id) => {
  const { data } = await axios.get(`${API_URL}/products/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const createProduct = async (productData) => {
  const { data } = await axios.post(`${API_URL}/products`, productData, {
    headers: getAuthHeader()
  });
  return data;
};

export const updateProduct = async (id, productData) => {
  const { data } = await axios.put(`${API_URL}/products/${id}`, productData, {
    headers: getAuthHeader()
  });
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await axios.delete(`${API_URL}/products/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const getCategories = async () => {
  const { data } = await axios.get(`${API_URL}/categories`, {
    headers: getAuthHeader()
  });
  return data;
};

// Orders
export const createOrder = async (orderData) => {
  const { data } = await axios.post(`${API_URL}/orders`, orderData, {
    headers: getAuthHeader()
  });
  return data;
};

export const getMyOrders = async () => {
  const { data } = await axios.get(`${API_URL}/orders/myorders`, {
    headers: getAuthHeader()
  });
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await axios.get(`${API_URL}/orders/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const getAllOrders = async () => {
  const { data } = await axios.get(`${API_URL}/orders`, {
    headers: getAuthHeader()
  });
  return data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await axios.put(`${API_URL}/orders/${id}/status`, { status }, {
    headers: getAuthHeader()
  });
  return data;
};

// User cancel order (only for pending orders)
export const userCancelOrder = async (id, reason = '') => {
  const { data } = await axios.put(`${API_URL}/orders/${id}/user-cancel`, { reason }, {
    headers: getAuthHeader()
  });
  return data;
};

// User update order (only for pending orders)
export const userUpdateOrder = async (id, updateData) => {
  const { data } = await axios.put(`${API_URL}/orders/${id}/user-update`, updateData, {
    headers: getAuthHeader()
  });
  return data;
};

// Network Marketing
export const getDownline = async () => {
  const { data } = await axios.get(`${API_URL}/network/downline`, {
    headers: getAuthHeader()
  });
  return data;
};

export const getNetworkStats = async () => {
  const { data } = await axios.get(`${API_URL}/network/stats`, {
    headers: getAuthHeader()
  });
  return data;
};

export const getCommissionHistory = async () => {
  const { data } = await axios.get(`${API_URL}/network/commissions`, {
    headers: getAuthHeader()
  });
  return data;
};

export const getAllSubscribers = async () => {
  const { data } = await axios.get(`${API_URL}/network/subscribers`, {
    headers: getAuthHeader()
  });
  return data;
};

export const updateSubscriberStatus = async (id, statusData) => {
  const { data} = await axios.put(`${API_URL}/network/subscribers/${id}`, statusData, {
    headers: getAuthHeader()
  });
  return data;
};

// Services
export const getAllServices = async (params = {}) => {
  const { data } = await axios.get(`${API_URL}/services`, {
    params,
    headers: getAuthHeader()
  });
  return data;
};

export const getService = async (id) => {
  const { data } = await axios.get(`${API_URL}/services/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const createService = async (serviceData) => {
  const formData = new FormData();

  // Append all service data fields
  Object.keys(serviceData).forEach(key => {
    if (key === 'images' && serviceData[key]) {
      // Handle multiple images
      Array.from(serviceData[key]).forEach(file => {
        formData.append('images', file);
      });
    } else if (key === 'socialMedia' && typeof serviceData[key] === 'object') {
      formData.append(key, JSON.stringify(serviceData[key]));
    } else if (serviceData[key] !== undefined && serviceData[key] !== null && key !== 'images') {
      formData.append(key, serviceData[key]);
    }
  });

  const { data } = await axios.post(`${API_URL}/services`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
};

export const updateService = async (id, serviceData) => {
  const { data } = await axios.put(`${API_URL}/services/${id}`, serviceData, {
    headers: getAuthHeader()
  });
  return data;
};

export const deleteService = async (id) => {
  const { data } = await axios.delete(`${API_URL}/services/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const submitServiceUsage = async (serviceId, usageData) => {
  const { data } = await axios.post(`${API_URL}/services/${serviceId}/usage`, usageData, {
    headers: getAuthHeader()
  });
  return data;
};

export const getMyServiceUsage = async () => {
  const { data } = await axios.get(`${API_URL}/services/usage/my-usage`, {
    headers: getAuthHeader()
  });
  return data;
};

export const getAllServiceUsage = async (params = {}) => {
  const { data } = await axios.get(`${API_URL}/services/usage/all`, {
    params,
    headers: getAuthHeader()
  });
  return data;
};

export const reviewServiceUsage = async (usageId, reviewData) => {
  const formData = new FormData();

  // Append all review data fields
  Object.keys(reviewData).forEach(key => {
    if (key === 'invoiceImages' && reviewData[key]) {
      // Handle multiple invoice images
      Array.from(reviewData[key]).forEach(file => {
        formData.append('invoiceImages', file);
      });
    } else if (reviewData[key] !== undefined && reviewData[key] !== null && key !== 'invoiceImages') {
      formData.append(key, reviewData[key]);
    }
  });

  const { data } = await axios.put(`${API_URL}/services/usage/${usageId}/review`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
};

export const addServiceReview = async (serviceId, reviewData) => {
  const { data } = await axios.post(`${API_URL}/services/${serviceId}/reviews`, reviewData, {
    headers: getAuthHeader()
  });
  return data;
};

export const getServiceCategories = async () => {
  const { data } = await axios.get(`${API_URL}/services/categories`, {
    headers: getAuthHeader()
  });
  return data;
};

// Suppliers
export const getSuppliers = async (params = {}) => {
  const { data } = await axios.get(`${API_URL}/suppliers`, {
    params,
    headers: getAuthHeader()
  });
  return data;
};

export const getSupplier = async (id) => {
  const { data } = await axios.get(`${API_URL}/suppliers/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const createSupplier = async (supplierData) => {
  const { data } = await axios.post(`${API_URL}/admin/users`, supplierData, {
    headers: getAuthHeader()
  });
  return data;
};

export const updateSupplier = async (id, supplierData) => {
  const { data } = await axios.put(`${API_URL}/admin/users/${id}`, supplierData, {
    headers: getAuthHeader()
  });
  return data;
};

export const deleteSupplier = async (id) => {
  const { data } = await axios.delete(`${API_URL}/admin/users/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const toggleSupplierStatus = async (id) => {
  const { data } = await axios.put(`${API_URL}/admin/users/${id}/status`, {}, {
    headers: getAuthHeader()
  });
  return data;
};

// Admin - Users Management
export const getAllUsers = async () => {
  const { data } = await axios.get(`${API_URL}/admin/users`, {
    headers: getAuthHeader()
  });
  return data;
};

export const createUser = async (userData) => {
  const { data } = await axios.post(`${API_URL}/admin/users`, userData, {
    headers: getAuthHeader()
  });
  return data;
};

export const getUserById = async (id) => {
  const { data } = await axios.get(`${API_URL}/admin/users/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const updateUser = async (id, userData) => {
  const { data } = await axios.put(`${API_URL}/admin/users/${id}`, userData, {
    headers: getAuthHeader()
  });
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await axios.delete(`${API_URL}/admin/users/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const getAdminStats = async () => {
  const { data } = await axios.get(`${API_URL}/admin/stats`, {
    headers: getAuthHeader()
  });
  return data;
};

// Library
export const getBooks = async (params = {}) => {
  const { data } = await axios.get(`${API_URL}/library/books`, {
    params,
    headers: getAuthHeader()
  });
  return data;
};

export const getBook = async (id) => {
  const { data } = await axios.get(`${API_URL}/library/books/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const createBook = async (bookData) => {
  const { data } = await axios.post(`${API_URL}/library/books`, bookData, {
    headers: getAuthHeader()
  });
  return data;
};

export const updateBook = async (id, bookData) => {
  const { data } = await axios.put(`${API_URL}/library/books/${id}`, bookData, {
    headers: getAuthHeader()
  });
  return data;
};

export const deleteBook = async (id) => {
  const { data } = await axios.delete(`${API_URL}/library/books/${id}`, {
    headers: getAuthHeader()
  });
  return data;
};

export const downloadBook = async (id) => {
  const { data } = await axios.post(`${API_URL}/library/books/${id}/download`, {}, {
    headers: getAuthHeader()
  });
  return data;
};

export const getBookCategories = async () => {
  const { data } = await axios.get(`${API_URL}/library/books/categories`, {
    headers: getAuthHeader()
  });
  return data;
};
