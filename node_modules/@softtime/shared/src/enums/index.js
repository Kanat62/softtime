"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weekday = exports.PaymentStatus = exports.RequestStatus = exports.RequestType = exports.DayStatus = exports.CheckOutStatus = exports.CheckInStatus = exports.SubStatus = exports.CompanyStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["PROVIDER"] = "PROVIDER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["WORKER"] = "WORKER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "PENDING";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["WARNING"] = "WARNING";
    UserStatus["BLOCKED"] = "BLOCKED";
    UserStatus["DELETED"] = "DELETED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var CompanyStatus;
(function (CompanyStatus) {
    CompanyStatus["TRIAL"] = "TRIAL";
    CompanyStatus["ACTIVE"] = "ACTIVE";
    CompanyStatus["GRACE"] = "GRACE";
    CompanyStatus["SUSPENDED"] = "SUSPENDED";
})(CompanyStatus || (exports.CompanyStatus = CompanyStatus = {}));
var SubStatus;
(function (SubStatus) {
    SubStatus["TRIAL"] = "TRIAL";
    SubStatus["ACTIVE"] = "ACTIVE";
    SubStatus["EXPIRED"] = "EXPIRED";
    SubStatus["GRACE"] = "GRACE";
    SubStatus["CANCELLED"] = "CANCELLED";
})(SubStatus || (exports.SubStatus = SubStatus = {}));
var CheckInStatus;
(function (CheckInStatus) {
    CheckInStatus["ON_TIME"] = "ON_TIME";
    CheckInStatus["LATE"] = "LATE";
    CheckInStatus["EARLY_ARRIVAL"] = "EARLY_ARRIVAL";
})(CheckInStatus || (exports.CheckInStatus = CheckInStatus = {}));
var CheckOutStatus;
(function (CheckOutStatus) {
    CheckOutStatus["ON_TIME"] = "ON_TIME";
    CheckOutStatus["LEFT_EARLY"] = "LEFT_EARLY";
    CheckOutStatus["OVERTIME"] = "OVERTIME";
})(CheckOutStatus || (exports.CheckOutStatus = CheckOutStatus = {}));
var DayStatus;
(function (DayStatus) {
    DayStatus["PRESENT"] = "PRESENT";
    DayStatus["LATE"] = "LATE";
    DayStatus["ABSENT"] = "ABSENT";
    DayStatus["INCOMPLETE"] = "INCOMPLETE";
    DayStatus["APPROVED_ABSENCE"] = "APPROVED_ABSENCE";
    DayStatus["MANUAL"] = "MANUAL";
    DayStatus["EARLY_LEAVE"] = "EARLY_LEAVE";
    DayStatus["OVERTIME"] = "OVERTIME";
})(DayStatus || (exports.DayStatus = DayStatus = {}));
var RequestType;
(function (RequestType) {
    RequestType["SICK"] = "SICK";
    RequestType["FAMILY"] = "FAMILY";
    RequestType["VACATION"] = "VACATION";
    RequestType["BUSINESS_TRIP"] = "BUSINESS_TRIP";
    RequestType["REMOTE"] = "REMOTE";
    RequestType["LATE_REASON"] = "LATE_REASON";
    RequestType["EARLY_LEAVE"] = "EARLY_LEAVE";
    RequestType["OTHER"] = "OTHER";
})(RequestType || (exports.RequestType = RequestType = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["APPROVED"] = "APPROVED";
    RequestStatus["REJECTED"] = "REJECTED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var Weekday;
(function (Weekday) {
    Weekday["MON"] = "MON";
    Weekday["TUE"] = "TUE";
    Weekday["WED"] = "WED";
    Weekday["THU"] = "THU";
    Weekday["FRI"] = "FRI";
    Weekday["SAT"] = "SAT";
    Weekday["SUN"] = "SUN";
})(Weekday || (exports.Weekday = Weekday = {}));
//# sourceMappingURL=index.js.map