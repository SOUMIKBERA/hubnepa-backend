# HubNepa Backend API Documentation

## Tech Stack
- **Runtime:** Node.js (Express.js)
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Access 15min + Refresh 7d)
- **Security:** bcryptjs, helmet, express-rate-limit, CORS
- **Email:** Nodemailer (Gmail SMTP)

## Setup
```bash
npm install
cp  .env   # fill in your values
npm run dev
```

## Base URL
`http://localhost:3000/api/v1`

---

# COMPLETE API LIST 

## 1. AUTH MODULE (9 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register (customer/retailer/restaurant/supplier/delivery) |
| POST | /auth/login | Login (all roles) |
| POST | /auth/google | Google OAuth |
| POST | /auth/forgot-password | Send reset email |
| POST | /auth/reset-password | Reset with token |
| POST | /auth/refresh-token | Refresh access token |
| GET | /auth/me | Get current user |
| POST | /auth/logout | Logout |
| POST | /auth/resend-verification | Resend verification email |

## 2. USER MODULE (12 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/profile | Get profile |
| PUT | /users/profile | Update profile |
| PUT | /users/change-password | Change password |
| POST | /users/addresses | Add address |
| PUT | /users/addresses/:id | Update address |
| DELETE | /users/addresses/:id | Delete address |
| GET | /users/notifications | Get notifications |
| PUT | /users/notifications/read-all | Mark all read |
| PUT | /users/notifications/:id/read | Mark one read |
| PUT | /users/preferences | Update preferences |
| DELETE | /users/account | Delete account |
| GET | /referral | Get referral info |

## 3. RESTAURANTS - Public (5 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /restaurants | List all (filter/sort/search) |
| GET | /restaurants/:id | Get by ID |
| GET | /restaurants/:id/menu | Get menu grouped by category |
| GET | /restaurants/search | Full text search |
| GET | /restaurants/featured | Featured/exclusive |

## 4. PRODUCTS - Public Marketplace (6 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | List (filter/sort/search) |
| GET | /products/:id | Get by ID |
| GET | /products/featured | Featured products |
| GET | /products/new-arrivals | New arrivals |
| GET | /products/categories | Get categories |
| GET | /products/search | Search |

## 5. CART (5 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cart | Get cart |
| POST | /cart/add | Add item (product or menu) |
| PUT | /cart/items/:itemId | Update quantity |
| DELETE | /cart/items/:itemId | Remove item |
| DELETE | /cart/clear | Clear cart |

## 6. ORDERS - Customer (7 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /orders | Place order (4-step checkout) |
| GET | /orders/my | Get my orders (filter: type/status) |
| GET | /orders/my/:id | Order detail + tracking |
| PUT | /orders/my/:id/cancel | Cancel order |
| POST | /orders/my/:id/refund | Request refund |
| POST | /orders/my/:id/reorder | Re-add items to cart |
| GET | /orders/my/:id/invoice | Generate invoice |

## 7. WALLET (6 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wallet | Get balance + reward points |
| POST | /wallet/top-up | Top up wallet |
| POST | /wallet/withdraw | Withdraw funds |
| GET | /wallet/transactions | Transaction history |
| POST | /wallet/apply-voucher | Apply voucher code |
| GET | /wallet/saved-cards | List saved cards |

## 8. WISHLIST (3 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wishlist | Get wishlist |
| POST | /wishlist/add | Add item |
| DELETE | /wishlist/:itemId | Remove item |

## 9. REVIEWS (6 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /reviews | Create review |
| GET | /reviews/restaurant/:id | Restaurant reviews |
| GET | /reviews/product/:id | Product reviews |
| PUT | /reviews/:id/reply | Retailer reply |
| PUT | /reviews/:id/helpful | Mark helpful |
| GET | /reviews/my/retailer | My product reviews (retailer) |

## 10. REFERRAL (2 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /referral | Get code + earnings |
| GET | /referral/referred-users | List referred users |

## 11. SUPPORT (5 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /support | Create ticket |
| GET | /support | My tickets |
| GET | /support/:id | Ticket detail |
| POST | /support/:id/reply | Reply to ticket |
| POST | /support/:id/admin-reply | Admin reply |

## 12. NOTIFICATIONS (5 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | Get all |
| PUT | /notifications/:id/read | Mark one read |
| PUT | /notifications/read-all | Mark all read |
| DELETE | /notifications/:id | Delete one |
| DELETE | /notifications/clear-all | Clear all |

## 13. RESTAURANT PANEL (42 APIs)
### Dashboard & Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /restaurant-panel/dashboard | Dashboard stats |
| GET | /restaurant-panel/orders | All orders (filter) |
| GET | /restaurant-panel/orders/live | Live kitchen orders |
| GET | /restaurant-panel/orders/:id | Order detail |
| PUT | /restaurant-panel/orders/:id/status | Update status |
| PUT | /restaurant-panel/orders/accept-all | Accept all pending |
| GET | /restaurant-panel/orders/history | Order history |
### Menu Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /restaurant-panel/menu | Get menu (filter) |
| POST | /restaurant-panel/menu | Add item |
| GET | /restaurant-panel/menu/:itemId | Get item |
| PUT | /restaurant-panel/menu/:itemId | Update item |
| DELETE | /restaurant-panel/menu/:itemId | Delete item |
| PUT | /restaurant-panel/menu/:itemId/availability | Toggle availability |
### Inventory & Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /restaurant-panel/inventory | Get inventory |
| POST | /restaurant-panel/inventory | Add item |
| PUT | /restaurant-panel/inventory/:id | Update item |
| PUT | /restaurant-panel/inventory/:id/adjust | Adjust stock |
| DELETE | /restaurant-panel/inventory/:id | Delete item |
| GET | /restaurant-panel/inventory/beverages | Get beverages |
| POST | /restaurant-panel/inventory/beverages | Add beverage |
| PUT | /restaurant-panel/inventory/beverages/:id/adjust | Adjust beverage |
| GET | /restaurant-panel/recipes | Get recipes |
| POST | /restaurant-panel/recipes | Create recipe |
| PUT | /restaurant-panel/recipes/:id | Update recipe |
| DELETE | /restaurant-panel/recipes/:id | Delete recipe |
### Expenses & Finance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /restaurant-panel/expenses | All expenses |
| POST | /restaurant-panel/expenses | Record expense |
| PUT | /restaurant-panel/expenses/:id | Update expense |
| DELETE | /restaurant-panel/expenses/:id | Delete expense |
| GET | /restaurant-panel/expenses/maintenance | Maintenance issues |
| POST | /restaurant-panel/expenses/maintenance | Report issue |
| PUT | /restaurant-panel/expenses/maintenance/:id | Update issue |
| GET | /restaurant-panel/expenses/payroll | Payroll list |
| POST | /restaurant-panel/expenses/payroll/run | Generate payroll |
| PUT | /restaurant-panel/expenses/payroll/:id/pay | Mark paid |
### Team Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /restaurant-panel/staff | List staff |
| POST | /restaurant-panel/staff | Add staff |
| GET | /restaurant-panel/staff/:id | Staff detail |
| PUT | /restaurant-panel/staff/:id | Update staff |
| PUT | /restaurant-panel/staff/:id/permissions | Update permissions |
| DELETE | /restaurant-panel/staff/:id | Terminate staff |
| GET | /restaurant-panel/staff/schedule | Get schedule |
| POST | /restaurant-panel/staff/schedule | Add shift |
| PUT | /restaurant-panel/staff/schedule/:id | Update shift |
| DELETE | /restaurant-panel/staff/schedule/:id | Delete shift |
| GET | /restaurant-panel/staff/requests | Get requests |
| PUT | /restaurant-panel/staff/requests/:id | Approve/reject |
### Sales & Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /restaurant-panel/sales-closing | Sales entries |
| POST | /restaurant-panel/sales-closing | Submit daily sales |
| GET | /restaurant-panel/sales-closing/missing | Missing dates |
| GET | /restaurant-panel/reports | Analytics & reports |
| GET | /restaurant-panel/settings | Get settings |
| PUT | /restaurant-panel/settings | Update settings |
| GET | /restaurant-panel/settings/locations | Get locations |
| POST | /restaurant-panel/settings/locations | Add location |
| PUT | /restaurant-panel/settings/locations/:id | Update location |
| DELETE | /restaurant-panel/settings/locations/:id | Delete location |

## 14. RETAILER PANEL (25 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /retailer/dashboard | Dashboard stats |
| GET/POST/PUT/DELETE | /retailer/products | Product CRUD |
| GET/PUT | /retailer/orders | Orders + status update |
| GET | /retailer/customers | Customer list |
| GET/POST/PUT/DELETE | /retailer/offers | Offer/coupon CRUD |
| GET/POST | /retailer/finance | Finance + withdrawal |
| GET/PUT | /retailer/refunds | Refund management |
| GET | /retailer/reports | Analytics |
| GET/PUT | /retailer/notifications | Notifications |
| GET/PUT | /retailer/settings/* | Profile/KYC/notifications/security |
| GET/POST | /retailer/support/tickets | Support tickets |

## 15. SUPPLIER PANEL (30 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /supplier/dashboard | Dashboard |
| GET/POST/PUT/DELETE | /supplier/products | Product catalog CRUD |
| GET/PUT | /supplier/orders | Wholesale orders |
| POST | /supplier/orders/manifest | Create shipping manifest |
| GET/POST/PUT | /supplier/warehouse/zones | Zone management |
| GET/POST | /supplier/warehouse/adjust | Stock adjustment |
| GET/POST/PUT | /supplier/clients | Client management |
| POST | /supplier/clients/broadcast | Broadcast to clients |
| GET/POST/PUT | /supplier/logistics | Shipments |
| PUT | /supplier/logistics/:id/assign-driver | Assign driver |
| GET | /supplier/finance | Financial overview |
| GET/POST/PUT | /supplier/finance/invoices | Invoice management |
| POST | /supplier/finance/payout | Request payout |
| GET | /supplier/reports | Analytics |
| GET/PUT | /supplier/settings | Settings |
| GET/POST | /supplier/support/tickets | Support tickets |

## 16. DELIVERY PANEL (12 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | /delivery/profile | Profile management |
| PUT | /delivery/status | Toggle online/offline |
| PUT | /delivery/location | Update GPS location |
| GET | /delivery/available-orders | Available pickups |
| PUT | /delivery/orders/:id/accept | Accept delivery |
| PUT | /delivery/orders/:id/decline | Decline delivery |
| GET | /delivery/my-deliveries | Active deliveries |
| GET | /delivery/my-deliveries/:id | Delivery detail |
| PUT | /delivery/orders/:id/status | Update status (in_transit/delivered) |
| GET | /delivery/earnings | Earnings dashboard |
| POST | /delivery/earnings/payout | Request payout |
| GET | /delivery/history | Delivery history |

## 17. ADMIN PANEL (32 APIs)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/dashboard | Platform dashboard |
| GET/PUT/DELETE | /admin/users | User management |
| PUT | /admin/users/:id/block | Block/unblock user |
| PUT | /admin/users/:id/role | Change role |
| GET/POST/PUT | /admin/partners/restaurants | Restaurant management |
| PUT | /admin/partners/restaurants/:id/approve | Approve restaurant |
| PUT | /admin/partners/restaurants/:id/reject | Reject restaurant |
| POST | /admin/partners | Create partner |
| GET/PUT | /admin/products | Product approval |
| GET/PUT | /admin/menu-items | Menu item management |
| GET | /admin/orders | All orders |
| GET/PUT | /admin/complaints | Feedback & complaints |
| GET | /admin/finance | Finance overview |
| GET/PUT | /admin/finance/refunds | Refund management |
| POST | /admin/finance/process-payouts | Process payouts |
| GET | /admin/analytics | Sales analytics |
| GET/POST/PUT/DELETE | /admin/marketing/campaigns | Campaign management |
| POST | /admin/marketing/notifications/send | Push notifications |
| GET/PUT | /admin/marketing/seo | SEO settings |
| GET/POST/PUT/DELETE | /admin/vouchers | Voucher management |
| GET/POST/PUT/DELETE | /admin/access-control/roles | Role management |
| GET/POST/PUT | /admin/access-control/users | Admin users |
| GET | /admin/access-control/logs | Audit logs |
| GET/PUT | /admin/settings | Platform settings |
| GET/PUT | /admin/settings/legal/:type | Legal docs |
| PUT | /admin/settings/maintenance | Maintenance mode |
| GET/PUT | /admin/notifications | Admin notifications |
| GET | /admin/reports | Full reports |

---