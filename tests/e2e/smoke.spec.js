const { test, expect } = require('@playwright/test');

test('should open homepage successfully', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await expect(page).toHaveURL('http://localhost:3000/');
});

test('should open order page and display main order sections', async ({ page }) => {
  await page.goto('http://localhost:3000/order.html');

  await expect(page.getByText('Build your custom order')).toBeVisible();
  await expect(page.getByText('Menu Options')).toBeVisible();
  await expect(page.getByText('Your Cart')).toBeVisible();
  await expect(page.getByText('Order History')).toBeVisible();
});

test('should add menu item to cart and update total', async ({ page }) => {
  await page.goto('http://localhost:3000/order.html');

  await page.getByRole('button', { name: 'Add to Cart' }).first().click();

  await expect(page.locator('#cartContainer')).toContainText('Donuts');
  await expect(page.locator('#cartTotal')).toContainText('Total: 3.00 KM');
});

test('should remove item from cart', async ({ page }) => {
  await page.goto('http://localhost:3000/order.html');

  await page.getByRole('button', { name: 'Add to Cart' }).first().click();

  await expect(page.locator('#cartContainer')).toContainText('Donuts');

  await page.getByRole('button', { name: 'Remove' }).click();

  await expect(page.locator('#cartContainer')).toContainText('Cart is empty.');
  await expect(page.locator('#cartTotal')).toContainText('Total: 0.00 KM');
});

test('should update custom order price when donut quantity is increased', async ({ page }) => {
  await page.goto('http://localhost:3000/order.html');

  await page.locator('[data-action="increase"][data-option="donuts"]').click();

  await expect(page.locator('#donutsCount')).toHaveText('4');
  await expect(page.locator('#customOrderPriceValue')).toHaveText('5.00 KM');
  await expect(page.locator('#customOrderSummary')).toContainText('Donuts x 4');
});

test('should reset custom order selections', async ({ page }) => {
  await page.goto('http://localhost:3000/order.html');

  await page.locator('[data-action="increase"][data-option="donuts"]').click();

  await page.getByRole('button', { name: 'Reset' }).click();

  await expect(page.locator('#donutsCount')).toHaveText('0');
  await expect(page.locator('#customOrderPriceValue')).toHaveText('0.00 KM');
});

test('should add custom order to cart', async ({ page }) => {
  await page.goto('http://localhost:3000/order.html');

  await page.locator('[data-action="increase"][data-option="donuts"]').click();

  await page.getByRole('button', { name: 'Add custom order to cart' }).click();

  await expect(page.locator('#cartContainer')).toContainText('Custom order #');
  await expect(page.locator('#cartContainer')).toContainText('Donuts x 4');
  await expect(page.locator('#cartTotal')).toContainText('Total: 5.00 KM');
});

test('should navigate to loyal customer registration page', async ({ page }) => {
  await page.goto('http://localhost:3000/order.html');

  await page.getByRole('link', { name: 'Loyal Customer Register' }).click();

  await expect(page).toHaveURL(/loyal_customer\.html/);
await expect(page.getByRole('heading', { name: 'Loyal Customer Form' })).toBeVisible();
});

test('should open loyal customer page from order page', async ({ page }) => {
  await page.goto('http://localhost:3000/order.html');

  await page.getByRole('link', { name: 'Loyal Customer Register' }).click();

  await expect(page).toHaveURL(/loyal_customer\.html/);
});

test('should display loyal customer registration form fields', async ({ page }) => {
  await page.goto('http://localhost:3000/loyal_customer.html');

  await expect(page.getByRole('heading', { name: 'Loyal Customer Form' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Loyal Customer' })).toBeVisible();
});

