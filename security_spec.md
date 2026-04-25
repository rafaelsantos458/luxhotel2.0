# Security Spec for Hotel Management System

## Data Invariants
1. Guest name, CPF, and birth date are required.
2. Inventory items must have a name, category, price, and stock.
3. Bookings must be linked to a valid room and guest.
4. Active bookings cannot be deleted; they must be completed or canceled.
5. Transactions are immutable logs of financial activity.
6. Users (receptionists/admins) have restricted roles.

## The "Dirty Dozen" Payloads

1. **Payload 1: Unauthorized Inventory Update**
   ```json
   { "name": "Hack", "price": 0.01, "stock": 99999 }
   ```
   *Expected: Denied (Not an admin/editor).*

2. **Payload 2: Price Spoofing in Booking**
   ```json
   { "basePrice": 1.00, "status": "active" }
   ```
   *Expected: Denied (Schema validation).*

3. **Payload 3: ID Poisoning**
   ```json
   { "id": "very-long-id-that-exceeds-limits-to-cause-resource-exhaustion" }
   ```
   *Expected: Denied (isValidId check).*

4. **Payload 4: Negative Stock**
   ```json
   { "stock": -50 }
   ```
   *Expected: Denied (Type/Boundary check).*

5. **Payload 5: Role Escalation**
   ```json
   { "role": "admin" }
   ```
   *Expected: Denied (Immutable role field for non-admins).*

6. **Payload 6: Orphaned Booking**
   ```json
   { "roomId": "non-existent-room", "guestId": "non-existent-guest" }
   ```
   *Expected: Denied (Relational Sync check).*

7. **Payload 7: PII Scraping**
   ```json
   { "email": "any-email@example.com" }
   ```
   *Expected: Denied (Restriction to owner/admin).*

8. **Payload 8: Terminal State Modification**
   ```json
   { "status": "active" } // where existing status is 'completed'
   ```
   *Expected: Denied (Terminal state locking).*

9. **Payload 9: Concurrent Stock Manipulation**
   ```json
   { "stock": 100 } // bypassing the logic that subtracts quantity
   ```
   *Expected: Denied (Action-based update requirements).*

10. **Payload 10: Fake Transaction Injection**
    ```json
    { "type": "income", "amount": 1000000, "description": "Loot" }
    ```
    *Expected: Denied (Valid user role required).*

11. **Payload 11: Future/Past Date Injection**
    ```json
    { "checkIn": 1893456000000, "checkOut": 1262304000000 } // Out of order
    ```
    *Expected: Denied (Logic check).*

12. **Payload 12: Nil Payment Method**
    ```json
    { "paymentMethod": null }
    ```
    *Expected: Denied (Enum validation).*

## Test Runner
A `firestore.rules.test.ts` will verify these payloads.
