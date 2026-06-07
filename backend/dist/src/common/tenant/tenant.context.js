"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantStorage = void 0;
exports.getTenantContext = getTenantContext;
const async_hooks_1 = require("async_hooks");
exports.tenantStorage = new async_hooks_1.AsyncLocalStorage();
function getTenantContext() {
    return exports.tenantStorage.getStore();
}
//# sourceMappingURL=tenant.context.js.map