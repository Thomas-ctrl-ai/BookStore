import{describe,it,expect}from"vitest";import{BOOK_ORDER_TRANSITIONS,PRINT_ORDER_TRANSITIONS,canTransitionOrder}from"./order-status";
describe("server-side status transition authorization",()=>{
 it("allows forward bookstore fulfillment and prevents reopening terminal orders",()=>{expect(canTransitionOrder(BOOK_ORDER_TRANSITIONS,"PENDING","CONFIRMED")).toBe(true);expect(canTransitionOrder(BOOK_ORDER_TRANSITIONS,"CONFIRMED","COMPLETED")).toBe(false);expect(canTransitionOrder(BOOK_ORDER_TRANSITIONS,"COMPLETED","PREPARING")).toBe(false);expect(canTransitionOrder(BOOK_ORDER_TRANSITIONS,"PREPARING","CANCELLED")).toBe(true)});
 it("enforces the print review and fulfillment flow",()=>{expect(canTransitionOrder(PRINT_ORDER_TRANSITIONS,"QUOTE_REQUIRED","QUOTED")).toBe(true);expect(canTransitionOrder(PRINT_ORDER_TRANSITIONS,"AWAITING_PAYMENT","PRINTING")).toBe(false);expect(canTransitionOrder(PRINT_ORDER_TRANSITIONS,"READY","COMPLETED")).toBe(true);expect(canTransitionOrder(PRINT_ORDER_TRANSITIONS,"COMPLETED","PRINTING")).toBe(false)});
 it("preserves the current state as an idempotent update",()=>{expect(canTransitionOrder(PRINT_ORDER_TRANSITIONS,"PRINTING","PRINTING")).toBe(true)});
});
