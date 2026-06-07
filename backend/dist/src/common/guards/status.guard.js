"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusGuard = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@softtime/shared");
const INACTIVE_STATUSES = new Set([
    shared_1.UserStatus.BLOCKED,
    shared_1.UserStatus.PENDING,
]);
let StatusGuard = class StatusGuard {
    canActivate(context) {
        const user = context
            .switchToHttp()
            .getRequest().user;
        if (!user?.status)
            return true;
        if (INACTIVE_STATUSES.has(user.status)) {
            throw new common_1.ForbiddenException('Account is not active');
        }
        return true;
    }
};
exports.StatusGuard = StatusGuard;
exports.StatusGuard = StatusGuard = __decorate([
    (0, common_1.Injectable)()
], StatusGuard);
//# sourceMappingURL=status.guard.js.map