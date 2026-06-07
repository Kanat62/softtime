"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.Roles = exports.ROLES_KEY = exports.Public = exports.IS_PUBLIC_KEY = exports.ApiStandardErrors = void 0;
const common_1 = require("@nestjs/common");
var api_responses_decorator_1 = require("./api-responses.decorator");
Object.defineProperty(exports, "ApiStandardErrors", { enumerable: true, get: function () { return api_responses_decorator_1.ApiStandardErrors; } });
const common_2 = require("@nestjs/common");
const tenant_context_1 = require("../tenant/tenant.context");
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.CurrentUser = (0, common_2.createParamDecorator)((_data, _ctx) => (0, tenant_context_1.getTenantContext)());
//# sourceMappingURL=index.js.map