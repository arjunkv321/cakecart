const { response } = require('express');
var express = require('express');
var router = express.Router();
var MongoClient=require('mongodb').MongoClient
var producthelpers=require('../helpers/producthelpers')
var userhelpers=require('../helpers/userhelpers')
const verifylogin=(req,res,next)=>{
  if(req.session.loggedin){
    next()
  }
  else{
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/', function(req, res, next) {
  let user=req.session.user
  producthelpers.getAllProduct().then(async(product)=>
  {
    let cartquantity=0
    if(user){
     cartquantity=await producthelpers.cartquantity(user._id)
    }
    
    res.render('index',{adminlog:false,product,user,cartquantity});
  })
  
});

router.get('/login', function(req, res, next) {
  
  if (req.session.user){
    res.redirect('/')
  }
  else
  {
   loginerr=req.session.loginerr
  res.render('users/login',{adminlog:false,loginp:true,loginerr});
  req.session.destroy()
  }
});

router.get('/signup/', function(req, res, next) {
  let valid=req.session.err
 
  res.render('users/signup',{adminlog:false,loginp:true,valid})
  req.session.err=false;
});

router.post('/signup', function(req, res, next) {
  
  userhelpers.doSignup(req.body).then((response)=>{
    if(response){
      req.session.loggedin=true
      req.session.user=response
      res.redirect('/')
    }
    else{
      req.session.err=true
      res.redirect('/signup/')
      
    }
    
  })
  
});

router.post('/login', function(req, res, next) {
  
  userhelpers.doLogin(req.body).then((response)=>{
    if(response.status)
    {
      req.session.loggedin=true
      req.session.user=response.user
    res.redirect('/')
    }
    else
    {
      req.session.loginerr=true
    res.redirect('/login')
    }
  })
  
});

router.get('/logout', function(req, res, next) {
  req.session.destroy()
  res.redirect('/')
  
});

router.get('/cart',verifylogin, function(req, res, next) {
  user=req.session.user
  producthelpers.viewcart(user._id).then((cart)=>{
    let cartproduct=cart.cartitems
    let carttotal=cart.carttotal
  res.render('users/cart',{adminlog:false,user,cartproduct,carttotal})})
  
});

router.get('/add-to-cart/:id',verifylogin, function(req, res, next) {
  id=req.params.id
  user=req.session.user
  producthelpers.addtocart(id,user._id).then((resolve)=>{
   
})
res.json({status:true})

});

router.get('/remove-cart-product/:id',verifylogin, function(req, res, next) {
  id=req.params.id
  user=req.session.user
  producthelpers.removecartproduct(id,user._id).then((resolve)=>{
})
res.redirect('/cart')
});

router.post('/changeQuantity',verifylogin, function(req, res, next) {
  user=req.session.user
  producthelpers.changequantity(req.body.cart,req.body.product,req.body.count,req.body.quantity).then((response)=>{
   res.json(response)
})

});

router.get('/placeorder',verifylogin, function(req, res, next) {
  user=req.session.user
  producthelpers.viewcart(user._id).then((cart)=>{
    let cartproduct=cart.cartitems
    let carttotal=cart.carttotal
  res.render('users/placeorder',{adminlog:false,user,cartproduct,carttotal})})
  
});
router.post('/placeorder',verifylogin,async function (req, res, next) {
  user=req.session.user
  let cart=await producthelpers.viewcart(user._id)
  console.log(cart)
  if(cart.carttotal){
  producthelpers.placeorder(req.body,user,cart).then((order)=>{
    if(req.body['payment-method']==='COD'){
      console.log('COD')
    res.json({id:order.orderid,status:order.status})}
    else{
      console.log('online')
      producthelpers.generatorRazorpay(order.orderid,order.totalPrice).then((response)=>{
        res.json(response)
      })
    }
  })
}
else{
  res.json({status:'empty'})
}
 

});
router.get('/orderdetails/:id',verifylogin, function(req, res, next) {
  orderid=req.params.id
  producthelpers.orderdetails(orderid).then((orderdetails)=>{
    console.log(orderdetails)
    res.render('users/orderdetails',{adminlog:false,user,orderdetails})
  })
 
  
});
router.get('/orders',verifylogin,function(req,res,next){
  user=req.session.user
  producthelpers.Allorderdetails(user._id).then((orders)=>{
    console.log(orders)
    res.render('users/orders',{adminlog:false,user,orders})
  
})});
router.post('/verifypayment',verifylogin,function(req,res,next){
  console.log(req.body)
  producthelpers.verifyPayment(req.body).then((response)=>{
    producthelpers.changeStatus(req.body['order[receipt]']).then((response)=>{
      console.log(response)
      res.json(response)
    })

  })
  
});
router.get('/orderstatus/:id',verifylogin,(req,res,next)=>{
  orderid=req.params.id
  user=req.session.user
  producthelpers.orderdetails(orderid).then((orderdetails)=>{
    res.render('users/orderstatus',{adminlog:false,status:orderdetails.status,orderid,user})
})})

module.exports = router;
