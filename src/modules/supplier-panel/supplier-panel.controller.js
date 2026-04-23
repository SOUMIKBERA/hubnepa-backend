const svc = require('./supplier-panel.service');
const { successResponse } = require('../../utils/apiResponse');

exports.getDashboard = async (req, res, next) => { try { return successResponse(res, 200, 'Dashboard.', await svc.getDashboard(req.user._id)); } catch (e) { next(e); } };
exports.getProducts = async (req, res, next) => { try { return successResponse(res, 200, 'Products.', await svc.getProducts(req.user._id, req.query)); } catch (e) { next(e); } };
exports.createProduct = async (req, res, next) => { try { const p = await svc.createProduct(req.user._id, req.body); return successResponse(res, 201, 'Product created.', { product: p }); } catch (e) { next(e); } };
exports.getProduct = async (req, res, next) => { try { const { SupplierProduct } = require('./supplier-panel.model'); const p = await SupplierProduct.findOne({ _id: req.params.id, supplier: req.user._id }); if (!p) return res.status(404).json({ success: false, message: 'Not found.' }); return successResponse(res, 200, 'Product.', { product: p }); } catch (e) { next(e); } };
exports.updateProduct = async (req, res, next) => { try { const p = await svc.updateProduct(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Updated.', { product: p }); } catch (e) { next(e); } };
exports.deleteProduct = async (req, res, next) => { try { await svc.deleteProduct(req.user._id, req.params.id); return successResponse(res, 200, 'Deleted.'); } catch (e) { next(e); } };

exports.getOrders = async (req, res, next) => { try { return successResponse(res, 200, 'Orders.', await svc.getOrders(req.user._id, req.query)); } catch (e) { next(e); } };
exports.getOrder = async (req, res, next) => { try { const { WholesaleOrder } = require('./supplier-panel.model'); const o = await WholesaleOrder.findOne({ _id: req.params.id, supplier: req.user._id }).populate('client', 'firstName lastName email phone'); if (!o) return res.status(404).json({ success: false, message: 'Not found.' }); return successResponse(res, 200, 'Order.', { order: o }); } catch (e) { next(e); } };
exports.updateOrderStatus = async (req, res, next) => { try { const o = await svc.updateOrderStatus(req.user._id, req.params.id, req.body.status); return successResponse(res, 200, 'Status updated.', { order: o }); } catch (e) { next(e); } };
exports.createManifest = async (req, res, next) => { try { const shipments = await svc.createManifest(req.user._id, req.body.orderIds, req.body); return successResponse(res, 201, 'Manifest created.', { shipments }); } catch (e) { next(e); } };

exports.getWarehouseZones = async (req, res, next) => { try { return successResponse(res, 200, 'Zones.', { zones: await svc.getWarehouseZones(req.user._id) }); } catch (e) { next(e); } };
exports.createZone = async (req, res, next) => { try { const z = await svc.createZone(req.user._id, req.body); return successResponse(res, 201, 'Zone created.', { zone: z }); } catch (e) { next(e); } };
exports.updateZone = async (req, res, next) => { try { const z = await svc.updateZone(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Zone updated.', { zone: z }); } catch (e) { next(e); } };
exports.getWarehouseItems = async (req, res, next) => { try { return successResponse(res, 200, 'Items.', await svc.getWarehouseItems(req.user._id, req.query)); } catch (e) { next(e); } };
exports.adjustStock = async (req, res, next) => { try { const item = await svc.adjustStock(req.user._id, req.body); return successResponse(res, 200, 'Stock adjusted.', { item }); } catch (e) { next(e); } };

exports.getClients = async (req, res, next) => { try { return successResponse(res, 200, 'Clients.', await svc.getClients(req.user._id, req.query)); } catch (e) { next(e); } };
exports.createClient = async (req, res, next) => { try { const c = await svc.createClient(req.user._id, req.body); return successResponse(res, 201, 'Client added.', { client: c }); } catch (e) { next(e); } };
exports.updateClient = async (req, res, next) => { try { const c = await svc.updateClient(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Client updated.', { client: c }); } catch (e) { next(e); } };
exports.broadcastToClients = async (req, res, next) => { try { const r = await svc.broadcastToClients(req.user._id, req.body.targetAudience, req.body.subject, req.body.message); return successResponse(res, 200, `Sent to ${r.recipientCount} clients.`, r); } catch (e) { next(e); } };

exports.getShipments = async (req, res, next) => { try { return successResponse(res, 200, 'Shipments.', await svc.getShipments(req.user._id, req.query)); } catch (e) { next(e); } };
exports.createShipment = async (req, res, next) => { try { const s = await svc.createShipment(req.user._id, req.body); return successResponse(res, 201, 'Shipment created.', { shipment: s }); } catch (e) { next(e); } };
exports.updateShipment = async (req, res, next) => { try { const s = await svc.updateShipment(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Shipment updated.', { shipment: s }); } catch (e) { next(e); } };
exports.assignDriver = async (req, res, next) => { try { const s = await svc.updateShipment(req.user._id, req.params.id, { driver: req.body.driver, vehicle: req.body.vehicle, status: 'Loading' }); return successResponse(res, 200, 'Driver assigned.', { shipment: s }); } catch (e) { next(e); } };

exports.getFinance = async (req, res, next) => { try { return successResponse(res, 200, 'Finance.', await svc.getFinanceOverview(req.user._id)); } catch (e) { next(e); } };
exports.getInvoices = async (req, res, next) => { try { return successResponse(res, 200, 'Invoices.', await svc.getInvoices(req.user._id, req.query)); } catch (e) { next(e); } };
exports.createInvoice = async (req, res, next) => { try { const inv = await svc.createInvoice(req.user._id, req.body); return successResponse(res, 201, 'Invoice created.', { invoice: inv }); } catch (e) { next(e); } };
exports.updateInvoice = async (req, res, next) => { try { const inv = await svc.updateInvoice(req.user._id, req.params.id, req.body); return successResponse(res, 200, 'Invoice updated.', { invoice: inv }); } catch (e) { next(e); } };
exports.requestPayout = async (req, res, next) => { try { if (!req.body.amount || req.body.amount <= 0) return res.status(422).json({ success: false, message: 'Valid amount required.' }); const r = await svc.requestPayout(req.user._id, req.body.amount); return successResponse(res, 200, 'Payout requested.', r); } catch (e) { next(e); } };

exports.getReports = async (req, res, next) => { try { return successResponse(res, 200, 'Reports.', await svc.getReports(req.user._id, req.query)); } catch (e) { next(e); } };
exports.getSettings = async (req, res, next) => { try { return successResponse(res, 200, 'Settings.', await svc.getSettings(req.user._id)); } catch (e) { next(e); } };
exports.updateSettings = async (req, res, next) => { try { return successResponse(res, 200, 'Settings saved.', await svc.updateSettings(req.user._id, req.body)); } catch (e) { next(e); } };