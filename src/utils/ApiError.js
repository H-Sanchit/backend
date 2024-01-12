class ApiError extends Error {
  constructor(
    statuscode,
    message = "Something went wroong",
    error = [],
    statch = ""
  ) {
    super(message),
      (this.statuscode = statuscode),
      (this.message = message),
      (this.data = null),
      (this.success = false),
      (this.error = error);
    this.statch = statch;
  }
}

export { ApiError };
