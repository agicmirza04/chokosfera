# Chokosfera Testing Documentation

## 1. Testing Overview

The purpose of testing was to verify the correctness, reliability, and functionality of the Chokosfera web application.

Two different testing approaches were used:

- Unit Testing (Jest)
- End-to-End Testing (Playwright)

Unit tests were used to verify the internal business logic of the application, including cart management, order processing, custom orders, localStorage handling, and order history functionality.

End-to-End (E2E) tests were used to simulate real user interactions through a web browser and verify that the main user workflows work correctly from the user's perspective.

Testing was performed throughout the development process to ensure that new functionality did not introduce regressions or unexpected behavior.


## 2. Testing Tools and Frameworks

### Jest

Jest was used for unit testing.

Reasons for selecting Jest:

- Easy integration with JavaScript projects
- Support for assertions and mocking
- Support for testing asynchronous functionality
- Built-in code coverage reporting
- Widely used and well documented

Jest was used to test business logic related to:

- Cart management
- Order placement
- Order cancellation
- Custom order calculations
- LocalStorage handling
- Order history functionality

### Playwright

Playwright was used for End-to-End (E2E) testing.

Reasons for selecting Playwright:

- Supports real browser automation
- Simulates real user interactions
- Reliable element selection and assertions
- Easy integration with modern JavaScript projects

Playwright was used to test:

- Homepage loading
- Order page loading
- Cart interactions
- Custom order workflows
- Navigation between pages
- Loyal customer registration page

### Framework Standards and Best Practices

The testing implementation follows recommended testing practices:

- Clear and descriptive test names
- Proper assertions using expect()
- Positive and negative test scenarios
- Separation of unit and E2E tests
- Reusable test structure
- Automated execution through npm scripts

Page Object Model (POM) was not implemented because the E2E test suite is relatively small and focused on a limited number of user workflows.


## 3. Test Cases

### Unit Testing
The table below shows the main representative unit test cases. The complete unit test suite contains 45 passing tests covering cart management, order processing, custom orders, localStorage handling, and order history functionality.

| Test Case | Functionality Tested | Expected Result | Actual Result | Type |
|------------|---------------------|-----------------|---------------|------|
| Add item to cart | Adding products to cart | Product is added successfully | Passed | Positive |
| Remove item from cart | Removing products from cart | Product is removed successfully | Passed | Positive |
| Place order successfully | Order placement | Order is stored and cart is cleared | Passed | Positive |
| Place order with empty cart | Order validation | Error is thrown | Passed | Negative |
| Cancel order | Order cancellation | Order status is updated | Passed | Positive |
| Invalid cart index | Cart validation | Item is not removed | Passed | Negative |
| Invalid localStorage data | Data validation | Empty cart is returned | Passed | Negative |
| Custom order calculation | Custom order pricing | Correct total is calculated | Passed | Positive |
| Empty custom order | Custom order validation | Total remains 0 | Passed | Boundary |
| Empty order history | Order history rendering | Empty message is displayed | Passed | Boundary |

### End-to-End Testing
The E2E test suite contains 10 browser-based tests. All E2E tests passed successfully and verify the main user workflows of the application.

| Test Case | Functionality Tested | Expected Result | Actual Result | Type |
|------------|---------------------|-----------------|---------------|------|
| Open homepage | Homepage loading | Homepage loads successfully | Passed | Positive |
| Open order page | Order page loading | Order page loads successfully | Passed | Positive |
| Add menu item to cart | Cart interaction | Product appears in cart and total updates | Passed | Positive |
| Remove item from cart | Cart interaction | Product is removed from cart | Passed | Positive |
| Update custom order price | Custom order builder | Price updates correctly | Passed | Positive |
| Reset custom order | Custom order builder | Counts and price reset to zero | Passed | Positive |
| Add custom order to cart | Custom order workflow | Custom order appears in cart | Passed | Positive |
| Navigate to loyal customer page | Navigation | Loyal customer page opens | Passed | Positive |
| Open loyal customer page from order page | Navigation | Correct page is displayed | Passed | Positive |
| Display loyal customer form fields | Form rendering | All required fields are visible | Passed | Positive |

## 4. Test Implementation

### Test Organization

The testing implementation is divided into two separate categories:

1. Unit Tests (Jest)
The file order.test.js contains 45 unit tests.

The tests were written using Jest and cover:

Cart management
Order placement
Order cancellation
Custom order calculations
LocalStorage handling
Order history functionality
Controller behavior
Error handling and validation scenarios

Mocking was used where appropriate to isolate business logic from browser dependencies.

2. End-to-End Tests (Playwright)
The file smoke.spec.js contains 10 Playwright E2E tests.

The tests simulate real user actions, including:

Opening pages
Clicking buttons
Adding and removing items from the cart
Creating custom orders
Navigating between pages
Verifying page content and UI updates

All E2E tests were executed using Playwright and passed successfully.


Unit tests focus on verifying the internal logic of the application, while E2E tests focus on verifying complete user workflows through the browser.

Keeping the two test suites separated improves maintainability, readability, and execution control.

### Test File Structure

The project uses the following test structure:

```text
tests/
├── order.test.js
└── e2e/
    └── smoke.spec.js

Coverage Results

Unit testing achieved the following coverage results:

Statements: 71.62%
Branches: 66.48%
Functions: 72.54%
Lines: 74.33%

The project satisfies the required minimum unit test coverage target of 70%.


5. Conclusion

The testing process confirmed that the main functionalities of the Chokosfera application work correctly.

The project includes 45 passing unit tests and 10 passing E2E tests. Unit test coverage is above the required 70% threshold, with 74.33% line coverage.

The tests cover positive, negative, and boundary scenarios, including cart management, custom orders, order processing, navigation, and loyal customer registration.

Based on the test results, the application meets the testing requirements defined for the project submission.



