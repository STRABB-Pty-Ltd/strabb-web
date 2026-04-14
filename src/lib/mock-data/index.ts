export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export {
  createListing,
  mockListingList,
} from "./listings";
export {
  createBooking,
  mockBookingList,
} from "./bookings";
export {
  createMessage,
  mockMessageList,
} from "./messages";
export {
  createCleaningTask,
  mockCleaningTaskList,
} from "./cleaning-tasks";
export {
  createFinancial,
  mockFinancialList,
} from "./financials";
export {
  createShoppingItem,
  mockShoppingItemList,
} from "./shopping-items";
export {
  createVacancy,
  mockVacancyList,
} from "./vacancies";
export {
  createMaintenance,
  mockMaintenanceList,
} from "./maintenance";
