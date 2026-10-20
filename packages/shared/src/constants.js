export const ROLES = Object.freeze({
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  ADMIN: "admin",
});
export const ROLE_LIST = Object.values(ROLES);

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"];

export const COURSE_STATUS = Object.freeze({
  DRAFT: "draft",
  REVIEW: "review",
  PUBLISHED: "published",
  REJECTED: "rejected",
});

export const LESSON_TYPES = ["video", "article", "quiz"];

export const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUND_REQUESTED: "refund_requested",
  REFUNDED: "refunded",
});

export const LANGUAGES = ["English", "Telugu", "Hindi", "Tamil", "Kannada"];

export const SORT_OPTIONS = {
  popular: "Most popular",
  rating: "Highest rated",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export const GST_RATE = 0.18;
export const REFUND_WINDOW_DAYS = 30;
export const PASSWORD_MIN = 8;
