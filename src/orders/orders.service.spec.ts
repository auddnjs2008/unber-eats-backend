import { Repository } from 'typeorm';
import { OrderService } from './orders.service'
import { Order, OrderStatus } from './entities/order.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateOrderItemInput } from './dtos/create-order.dto';



const mockRepository = () => ({
    findOne:jest.fn(),
    find:jest.fn(),
    save:jest.fn(),
    create:jest.fn(),
});



type MockRepository<T=any> = Partial<Record<keyof Repository<T>,jest.Mock>>;


describe('Order Service', () => {
    let service :OrderService;
    let orderRepository:MockRepository<Order>;
    let orderItemRepository:MockRepository<OrderItem>;
    let restaurantRepository:MockRepository<Restaurant>;
    let dishRepository :MockRepository<Dish>;


    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers:[
                OrderService,
                {
                    provide:getRepositoryToken(Order),useValue:mockRepository()
                },
                {
                    provide:getRepositoryToken(OrderItem),useValue:mockRepository()
                },
                {
                    provide:getRepositoryToken(Restaurant),useValue:mockRepository()
                },
                {
                    provide:getRepositoryToken(Dish),useValue:mockRepository()
                }
            ]
        }).compile();

        service = module.get<OrderService>(OrderService);
        orderItemRepository = module.get(getRepositoryToken(OrderItem));
        orderRepository = module.get(getRepositoryToken(Order));
        restaurantRepository = module.get(getRepositoryToken(Restaurant));
        dishRepository = module.get(getRepositoryToken(Dish));
    });

    it('be defined',() => {
        expect(service).toBeDefined();
    })

   
    describe('createOrder',() => {
        const fakeUser:User = {
            id:1,
            email:'',
            password:'',
            role:UserRole.Client,
            verified:true,
            restaurants:[],
            orders:[],
            rides:[],
            createdAt:new Date(),
            updatedAt:new Date(),
            checkPassword:()=>{ return new Promise(resolve =>resolve)},
            hashPassword:()=>{return new Promise(resolve => resolve)}
        };

        const fakedItems:CreateOrderItemInput[] = [
            {
                dishId:1,
                options: [{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]

            }
        ]



        it('should fail if restaurant not found', async () => {
            restaurantRepository.findOne.mockResolvedValue(undefined);
            const result = await service.createOrder(fakeUser,{restaurantId:1,items:fakedItems});
            expect(result).toMatchObject({
                ok:false,
                error:'Restaurant not found'
            });
        });

        it('should fail if dish not found', async () => {
            restaurantRepository.findOne.mockResolvedValue({id:1});
            dishRepository.findOne.mockResolvedValue(undefined);
            const result = await service.createOrder(fakeUser,{restaurantId:1,items:fakedItems});
            expect(result).toMatchObject({
                ok:false,
                error:'Dish not found'
            });
        });


        it('should create a new Order' , async () => {

            const fakeDish = {id:1,price:10,options:[{name:'spicy', choices:[{name:'little bit'}]  ,extra:1},{name:'size',choices:[{name:'large',extra:1}]}]};


            restaurantRepository.findOne.mockResolvedValue({id:1});
            dishRepository.findOne.mockResolvedValue(fakeDish);
            orderItemRepository.create.mockReturnValue({dish:{id:1},options:[{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]});
            orderItemRepository.save.mockResolvedValue({dish:{id:1},options:[{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]});
            orderRepository.create.mockReturnValue({customer:fakeUser,restaurant:{id:1},total:12,items:[{dish:{id:1},options:[{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]}]});
            orderRepository.save.mockResolvedValue({customer:fakeUser,restaurant:{id:1},total:12,items:[{dish:{id:1},options:[{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]}]});


            const result = await service.createOrder(fakeUser,{restaurantId:1,items:fakedItems});

            expect(orderItemRepository.create).toHaveBeenCalledTimes(1);
            expect(orderItemRepository.create).toHaveBeenCalledWith({dish:fakeDish,options:[{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]});

            expect(orderItemRepository.save).toHaveBeenCalledTimes(1);
            expect(orderItemRepository.save).toHaveBeenCalledWith({dish:{id:1},options:[{name:"spicy",choice:"little bit"},{name:"size",choice:"large"}]});


            expect(orderRepository.create).toHaveBeenCalledTimes(1);
            expect(orderRepository.create).toHaveBeenCalledWith({customer:fakeUser,restaurant:{id:1},total:12,items:[{dish:{id:1},options:[{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]}]});

            expect(orderRepository.save).toHaveBeenCalledTimes(1);
            expect(orderRepository.save).toHaveBeenCalledWith({customer:fakeUser,restaurant:{id:1},total:12,items:[{dish:{id:1},options:[{name:"spicy", choice:'little bit'},{name:"size",choice:"large"}]}]});


            expect(result).toEqual({ok:true});

        });


        it('should failed on exception', async () => {
            restaurantRepository.findOne.mockRejectedValue(new Error(''));
            const result = await service.createOrder(fakeUser,{restaurantId:1,items:[]});
            expect(result).toMatchObject({
                ok:false,
                error:'Could not create order'
            })

        });




    });



    describe('getOrders',() => {
        const fakeUser:User = {
            id:1,
            email:'',
            password:'',
            role:UserRole.Client,
            verified:true,
            restaurants:[],
            orders:[],
            rides:[],
            createdAt:new Date(),
            updatedAt:new Date(),
            checkPassword:()=>{ return new Promise(resolve =>resolve)},
            hashPassword:()=>{return new Promise(resolve => resolve)}
        };

        const fakedItems:CreateOrderItemInput[] = [
            {
                dishId:1,
                options: [{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]

            }
        ]

        it('if user is client',async () => {
            orderRepository.find.mockResolvedValue([{items:fakedItems,status:'Pending'}]);
            const result = await service.getOrders(fakeUser,{status:OrderStatus.Pending});
            expect(result).toMatchObject({ok:true, orders:[{items:fakedItems,status:'Pending'}]});
        })

        it('if user is delivery', async () => {
           fakeUser.role = UserRole.Delivery;
           orderRepository.find.mockResolvedValue([{items:fakedItems,status:'Pending'}]);
           const result = await service.getOrders(fakeUser,{status:OrderStatus.Pending});
           expect(result).toMatchObject({ok:true, orders:[{items:fakedItems,status:'Pending'}]});
        });

        it('if user is Owner', async () => {
            fakeUser.role = UserRole.Owner;
            restaurantRepository.find.mockResolvedValue([{id:1,orders:[{items:fakedItems,status:'Pending'}]}]);
            orderRepository.find.mockResolvedValue([{items:fakedItems,status:'Pending'}]);
            const result = await service.getOrders(fakeUser,{status:OrderStatus.Pending});
            expect(result).toMatchObject({ok:true, orders:[{items:fakedItems,status:'Pending'}]});
        })

        it('should fail on exception',async () => {
            orderRepository.find.mockResolvedValue(new Error(''));
            const result = await service.getOrders(fakeUser,{status:OrderStatus.Pending});
            expect(result).toMatchObject({
                ok:false,
                error: "Could not get orders"
            })
        })
    });


    describe('getOrder',() => {
        const fakeUser:User = {
            id:2,
            email:'',
            password:'',
            role:UserRole.Client,
            verified:true,
            restaurants:[],
            orders:[],
            rides:[],
            createdAt:new Date(),
            updatedAt:new Date(),
            checkPassword:()=>{ return new Promise(resolve =>resolve)},
            hashPassword:()=>{return new Promise(resolve => resolve)}
        };

        const fakedItems:CreateOrderItemInput[] = [
            {
                dishId:1,
                options: [{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]

            }
        ]


        it('couldnt find Order',async ()=>{
            orderRepository.findOne.mockResolvedValue(undefined);
            const result = await service.getOrder(fakeUser,{id:1});
            expect(result).toMatchObject({
                ok:false,
                error:"Order not found"
            });
        });

        it('cant see order', async () => {
        const fakeOrder = {items:fakedItems,status:'Pending',customerId:1,driverId:1, restaurant:{ownerId:1}}
            orderRepository.findOne.mockResolvedValue(fakeOrder);
            const result = await service.getOrder(fakeUser,{id:1});
            expect(result).toMatchObject( {
                ok:false,
                error: 'You cant see that'
            })
        })

        it('should get Order', async () => {
        const fakeOrder = {items:fakedItems,status:'Pending',customerId:2,driverId:1, restaurant:{ownerId:1}}
            orderRepository.findOne.mockResolvedValue(fakeOrder);
            const result = await service.getOrder(fakeUser,{id:1});
            expect(result).toMatchObject({
                ok:true,
                order:fakeOrder
            });
        });

        it('should error on exception', async () => {
    
            const fakeUser:User = {
                id:1,
                email:'',
                password:'',
                role:UserRole.Client,
                verified:true,
                restaurants:[],
                orders:[],
                rides:[],
                createdAt:new Date(),
                updatedAt:new Date(),
                checkPassword:()=>{ return new Promise(resolve =>resolve)},
                hashPassword:()=>{return new Promise(resolve => resolve)}
            };

       
            orderRepository.findOne.mockRejectedValue(new Error(''));
            const result = await service.getOrder(fakeUser,{id:1});
            expect(result).toEqual({
                ok:false,
                error:'Could not find order'
            });
        });

        




    });


    describe('editOrder', () => {

        const fakeUser:User = {
            id:2,
            email:'',
            password:'',
            role:UserRole.Client,
            verified:true,
            restaurants:[],
            orders:[],
            rides:[],
            createdAt:new Date(),
            updatedAt:new Date(),
            checkPassword:()=>{ return new Promise(resolve =>resolve)},
            hashPassword:()=>{return new Promise(resolve => resolve)}
        };
        const fakedItems:CreateOrderItemInput[] = [
            {
                dishId:1,
                options: [{name:"spicy",choice:'little bit'},{name:"size",choice:"large"}]

            }
        ]




        it('Order Not Found', async () => {
            orderRepository.findOne.mockResolvedValue(undefined);
            const result = await service.editOrder(fakeUser,{id:1,status:OrderStatus.Pending});
            expect(result).toEqual( {
                ok:false,
                error:"Order not found",
            });
        });

        it('Cant see order', async () => {
            const fakeOrder = {items:fakedItems,status:'Pending',customerId:1,driverId:1, restaurant:{ownerId:1}}
            orderRepository.findOne.mockResolvedValue(fakeOrder);
            const result = await service.editOrder(fakeUser,{id:1,status:OrderStatus.Pending});

            expect(result).toEqual({
                ok:false,
                error:"Cant see this."
            });
        })

        it('Cant edit order when user', async () => {
            const fakeOrder = {items:fakedItems,status:'Pending',customerId:2,driverId:1, restaurant:{ownerId:1}}
            orderRepository.findOne.mockResolvedValue(fakeOrder);
            const result = await service.editOrder(fakeUser,{id:1,status:OrderStatus.Pending});

            expect(result).toEqual( {
                ok:false,
                error:'You cant do that'
            })
        });

        it('Cnat edit order when Cooked and Cooking', async () => {
            fakeUser.role=UserRole.Owner;
            const fakeOrder = {items:fakedItems,status:'Pending',customerId:2,driverId:1, restaurant:{ownerId:2}}
            orderRepository.findOne.mockResolvedValue(fakeOrder);
            const result = await service.editOrder(fakeUser,{id:1,status:OrderStatus.Pending});

            expect(result).toEqual( {
                ok:false,
                error:'You cant do that'
            })

        })

        it('Cant edit order when delivery and food status is pickedUp & delivered', async () => {
            fakeUser.role = UserRole.Delivery;
            const fakeOrder = {items:fakedItems,status:'Pending',customerId:2,driverId:2, restaurant:{ownerId:2}}
            orderRepository.findOne.mockResolvedValue(fakeOrder);
            const result = await service.editOrder(fakeUser,{id:1,status:OrderStatus.Pending});
            expect(result).toEqual( {
                ok:false,
                error:'You cant do that'
            })
        });

        it('Should error on exception', async () => {
            orderRepository.findOne.mockRejectedValue(new Error(''));
            const result = await service.editOrder(fakeUser,{id:1,status:OrderStatus.Pending});
            expect(result).toEqual({
                ok:false,
                error:'could not edit'
             });
        });

        it('Can Edit Order', async () => {
            fakeUser.role = UserRole.Owner
            const fakeOrder = {items:fakedItems,status:'Pending',customerId:2,driverId:2, restaurant:{ownerId:2}};
            orderRepository.findOne.mockResolvedValue(fakeOrder);
            const result = await service.editOrder(fakeUser,{id:1,status:OrderStatus.Cooking});

            expect(result).toEqual({ok:true});



        });



    });

})