import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        const key = 'scroll:' + to.fullPath;
        const savedTop = sessionStorage.getItem(key);
        if (savedTop) {
            return { left: 0, top: parseInt(savedTop, 10) || 0 };
        }
        return { left: 0, top: 0 };
    },
    routes: [{
        path: '/',
        redirect: '/index'
    },{
        path: '/login',
        component: ()=>import('../pages/Login.vue')
    },{
        path: '/register',
        component: ()=>import('../pages/Register.vue')
    },{
        path: '/index',
        component: ()=>import('../pages/Index.vue')
    },
    {
        path: '/store',
        component: ()=>import('../pages/store.vue'),
        children:[
            { path: '', redirect: '/store/home' },
            { path: 'home', component: ()=>import('../components/Store/StoreDashboard.vue') },
            { path: 'my-products', component: ()=>import('../components/Store/MyProducts.vue') },
            { path: 'releaseProduct/:id', component: ()=>import('../components/Store/ReleaseProduct.vue') },
            { path: 'orderManage', component: ()=>import('../components/Store/OrderManage.vue') },
            { path: 'comments', component: ()=>import('../pages/storedown/MerchantComments.vue') },
            { path: 'publishRedPacket', component: ()=>import('../components/Store/PublishRedPacket.vue') },
            { path: 'redPackets', component: ()=>import('../components/Store/RedPacketList.vue') }
        ]
    },{
        path: '/userInfo',
        component: ()=>import('../pages/storedown/userInfo.vue')
    },{
        path: '/favorites',
        component: ()=>import('../pages/storedown/Favorites.vue')
    },{
        path: '/footprints',
        component: ()=>import('../pages/storedown/Footprints.vue')
    },{
    },{
        path: '/merchantInfo',
        component: ()=>import('../pages/storedown/merchantInfo.vue')
    },{
        path: '/merchantshop',
        component: ()=>import('../components/Store/MerchantShop.vue'),
        meta: { keepScroll: true }
    },{
    },{
        path: '/products',
        component: ()=>import('../pages/Indexdown/Products.vue'),
        meta: { keepScroll: true }
    },{
        path: '/productInfo/:itemId',
        name: 'productInfo',
        component: ()=>import('../pages/Indexdown/ProductInfo.vue')
    },{
        path: '/cart',
        component: ()=>import('../pages/Cart.vue')
    },{
        path: '/checkout',
        component: ()=>import('../pages/Checkout.vue')
    },{
        path: '/orderConfirm/:orderNo',
        name: 'orderConfirm',
        component: ()=>import('../pages/OrderConfirm.vue')
    },{
        path: '/orderDetail/:orderNo',
        name: 'OrderDetail',
        component: ()=>import('../pages/OrderDetail.vue')
    },{
        path: '/myDiscounts',
        name: 'MyDiscounts',
        component: ()=>import('../pages/MyDiscounts.vue')
    },{
        path: '/orderTasks',
        component: ()=>import('../pages/OrderTasks.vue'),
        meta: { keepScroll: true }
    },{
        path: '/openShop',
        component: ()=>import('../components/Store/OpenShop.vue'),
    },{
        path: '/system',
        component: ()=>import('../pages/system.vue'),
        children:[
            {
                path: '/user',
                component: ()=>import('../components/System/UserManagement.vue')
            },
            {
                path: '/store',
                component: ()=>import('../components/System/StoresMangement.vue')
            }
        ]
    }]
})

// 添加路由调试
router.beforeEach((to, from, next) => {
    console.log('路由导航:', from.path, '->', to.path);
    // 在离开前保存滚动位置（用于刷新后恢复）
    try {
        if (from.meta && from.meta.keepScroll) {
            const top = window.scrollY || document.documentElement.scrollTop || 0;
            const key = 'scroll:' + from.fullPath;
            sessionStorage.setItem(key, String(top));
        }
    } catch (e) {}
    next();
});

// router.beforeEach((to,form,next)=>{
//     if(to.path == '/login') return next()
//     if(window.localStorage.getItem('token')) return next()
//     next('/login')
// })

// 刷新或关闭页面前保存当前滚动位置
try {
    window.addEventListener('beforeunload', () => {
        const route = router.currentRoute.value;
        if (route.meta && route.meta.keepScroll) {
            const top = window.scrollY || document.documentElement.scrollTop || 0;
            sessionStorage.setItem('scroll:' + route.fullPath, String(top));
        }
    });
} catch (e) {}

export default router