# Nuber Eats

The Backend of Nuber Eats cLone

## User Model

- id
- createdAt
- updatedAt

- email
- password
- role(client | owner | delivery)

## User CRUD:

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email


## Restaurant Model

- name
- category
- address
- coverImage


# Number Eats

-See Categories
-See Restaurants by Category (pagination)

-See Restaurants  (pagination)
-See REstaurant

-Edit Restaurant
-Delete Restaurant

-Create Dish
-Edit Dish
-Delete Dish



- Orders Subscription :
    -Pending Orders (Owner) (subscription:newOrder )(trigger: createOrder(newOrder))
    -Order Status (Customer, Delivery, OWner) (s: orderUpdate)(t: editOrder(orderUpdate))
    -Pending Pickup Order (Deliver) (s: orderUpdate) (t: editOrder(orderUpdate))