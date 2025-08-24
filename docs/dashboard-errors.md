# Dashboard Error Reference

This document provides a reference for the errors that are tracked in the CRYONEL Grafana dashboard. These errors are reported by the `cryonel-api` service.

## Error Types

### VALIDATION_ERROR

- **Severity**: Low
- **Description**: This error occurs when the API receives invalid input data from a client. This is usually caused by a malformed request from the frontend or an external client.
- **Troubleshooting**:
  - Check the request details in the logs to see what data was sent.
  - The response body for this error usually contains a `details` field with more information about which fields were invalid.
  - If the request is coming from the frontend, ensure that the frontend code is sending the correct data structure.

### AUTHENTICATION_ERROR

- **Severity**: Medium
- **Description**: This error indicates that a user is not authenticated but is trying to access a protected resource. This can happen if the user's session has expired or if they are trying to access the API without logging in.
- **Troubleshooting**:
  - The user should be prompted to log in again.
  - If this error is happening unexpectedly, check the JWT validation logic in the `auth` middleware.

### AUTHORIZATION_ERROR

- **Severity**: Medium
- **Description**: This error occurs when an authenticated user tries to access a resource that they do not have permission to access.
- **Troubleshooting**:
  - Check the user's roles and permissions.
  - Verify that the resource's access control rules are configured correctly.

### NOT_FOUND

- **Severity**: Low
- **Description**: This error means that the requested resource could not be found on the server. This is often caused by a client requesting an invalid URL or an ID of a resource that does not exist.
- **Troubleshooting**:
  - Check the request URL to ensure it is correct.
  - If the request is for a specific resource by ID, verify that the resource exists in the database.

### CONFLICT

- **Severity**: Medium
- **Description**: This error indicates that the request could not be completed because of a conflict with the current state of the resource. For example, trying to update a resource that has been modified by another user.
- **Troubleshooting**:
  - The client should be prompted to reload the resource and try the operation again.

### DUPLICATE_ENTRY

- **Severity**: Medium
- **Description**: This is a database error that occurs when a client tries to create a resource that already exists, violating a unique constraint in the database. For example, trying to register a username that is already taken.
- **Troubleshooting**:
  - The user should be informed that the resource already exists.
  - Check the database schema to see which field has the unique constraint.

### INVALID_REFERENCE

- **Severity**: Medium
- **Description**: This is a database error that occurs when a client tries to create or update a resource with a reference to another resource that does not exist. For example, creating an order for a user ID that does not exist.
- **Troubleshooting**:
  - The client should be informed that the referenced resource is invalid.
  - Check the request data to ensure that all foreign key references are valid.

### INVALID_TOKEN

- **Severity**: Medium
- **Description**: This error occurs when the API receives an invalid JSON Web Token (JWT). This can happen if the token is malformed or has been tampered with.
- **Troubleshooting**:
  - The user should be prompted to log in again.
  - Check the JWT signing and verification process.

### TOKEN_EXPIRED

- **Severity**: Medium
- **Description**: This error occurs when the API receives a JWT that has expired.
- **Troubleshooting**:
  - The frontend should automatically handle this error by refreshing the token or prompting the user to log in again.
  - Check the token expiration settings.

### INTERNAL_SERVER_ERROR

- **Severity**: High
- **Description**: This is a catch-all error for any unexpected error that occurs on the server. This indicates a bug in the application code.
- **Troubleshooting**:
  - **This is a high-priority error and should be investigated immediately.**
  - Check the error logs for the full stack trace and request context.
  - Identify the root cause of the error and deploy a fix.
