class ApiResponse {
  constructor(statuscode, message = "Success", data) {
    (this.statuscode = statuscode),
      (this.message = message),
      (this.data = data),
      (this.success = statuscode);
  }
}

export { ApiResponse };
