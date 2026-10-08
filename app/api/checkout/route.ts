import {NextResponse} from "next/server";
import {randomBytes} from "node:crypto";
import {prisma} from "@/lib/db";
import {checkoutSchema} from "@/lib/validation";
import {jsonError,verifySameOrigin} from "@/lib/http";

export async function POST(req:Request){
 if(!verifySameOrigin(req))return NextResponse.json({error:"Invalid request origin."},{status:403});
 try{
  const input=checkoutSchema.parse(await req.json());
  const existing=await prisma.bookOrder.findUnique({where:{idempotencyKey:input.idempotencyKey},select:{orderNumber:true,totalMmk:true}});
  if(existing)return NextResponse.json({orderNumber:existing.orderNumber,totalMmk:existing.totalMmk,reused:true});
  const paymentSetting=await prisma.storeSetting.findUnique({where:{key:"payments"}});
  const payment=(paymentSetting?.value??{codEnabled:true,bankEnabled:false,mobileEnabled:false}) as Record<string,unknown>;
  const enabled=input.paymentMethod==="COD"?payment.codEnabled===true:input.paymentMethod==="BANK_TRANSFER"?payment.bankEnabled===true:payment.mobileEnabled===true;
  if(!enabled)return NextResponse.json({error:"That payment method is not available. Please choose an enabled option."},{status:400});
  const deliverySetting=await prisma.storeSetting.findUnique({where:{key:"delivery"}});
  const delivery=(deliverySetting?.value??{feeMmk:0,minimumFreeMmk:0}) as Record<string,unknown>;
  const deliveryFee=Number.isSafeInteger(delivery.feeMmk)?delivery.feeMmk as number:0;
  const stockByProduct=new Map<string,number>();
  for(const item of input.items)stockByProduct.set(item.productId,(stockByProduct.get(item.productId)||0)+item.quantity);
  const ids=[...stockByProduct.keys()];
  const products=await prisma.product.findMany({where:{id:{in:ids},status:"ACTIVE"},select:{id:true,title:true,priceMmk:true,stock:true,sampleData:true,levels:true,level:true}});
  if(products.length!==ids.length||products.some(p=>p.sampleData))return NextResponse.json({error:"One or more products are no longer available. Refresh your bag and try again."},{status:409});
  const byId=new Map(products.map(product=>[product.id,product]));
  const lines=input.items.map(item=>{
   const product=byId.get(item.productId)!;
   const levels=product.levels.length?product.levels:product.level?[product.level]:[];
   if(levels.length&&!item.selectedLevel)return {error:"Please select a level for every book in your bag." as const};
   if(item.selectedLevel&&!levels.includes(item.selectedLevel))return {error:"A selected book level is no longer available. Refresh your bag and try again." as const};
   return {productId:product.id,titleSnapshot:product.title,levelSnapshot:item.selectedLevel??null,priceMmk:product.priceMmk,quantity:item.quantity,lineTotalMmk:product.priceMmk*item.quantity};
  });
  const invalid=lines.find(line=>"error" in line);
  if(invalid&&"error" in invalid)return NextResponse.json({error:invalid.error},{status:400});
  const orderLines=lines as Array<{productId:string;titleSnapshot:string;levelSnapshot:string|null;priceMmk:number;quantity:number;lineTotalMmk:number}>;
  const subtotal=orderLines.reduce((sum,line)=>sum+line.lineTotalMmk,0);
  if(!Number.isSafeInteger(subtotal)||subtotal<1)return NextResponse.json({error:"The order total is invalid."},{status:400});
  const finalDelivery=typeof delivery.minimumFreeMmk==="number"&&delivery.minimumFreeMmk>0&&subtotal>=delivery.minimumFreeMmk?0:deliveryFee;
  const orderNumber=`PNK-${new Date().toISOString().slice(2,10).replaceAll("-","")}-${randomBytes(8).toString("hex").toUpperCase()}`;
  const order=await prisma.$transaction(async tx=>{
   for(const product of products){const quantity=stockByProduct.get(product.id)!;const result=await tx.product.updateMany({where:{id:product.id,status:"ACTIVE",stock:{gte:quantity}},data:{stock:{decrement:quantity}}});if(result.count!==1)throw new Error(`OUT_OF_STOCK:${product.id}`);}
   return tx.bookOrder.create({data:{orderNumber,customerName:input.customerName,phone:input.phone,email:input.email||null,address:input.address,city:input.city,township:input.township,deliveryInstructions:input.deliveryInstructions||null,subtotalMmk:subtotal,deliveryMmk:finalDelivery,totalMmk:subtotal+finalDelivery,paymentMethod:input.paymentMethod,paymentStatus:input.paymentMethod==="COD"?"UNPAID":"PENDING",idempotencyKey:input.idempotencyKey,statusHistory:[{status:"PENDING",at:new Date().toISOString(),by:"system"}],items:{create:orderLines}}});
  });
  return NextResponse.json({orderNumber:order.orderNumber,totalMmk:order.totalMmk,paymentMethod:order.paymentMethod,paymentStatus:order.paymentStatus});
 }catch(e){
  if(e instanceof Error&&e.message.startsWith("OUT_OF_STOCK:"))return NextResponse.json({error:"A book in your order just sold out. Please update your bag."},{status:409});
  if(typeof e==="object"&&e!==null&&"code" in e&&(e as {code?:string}).code==="P2002"){const input=checkoutSchema.parse(await req.clone().json());const existing=await prisma.bookOrder.findUnique({where:{idempotencyKey:input.idempotencyKey},select:{orderNumber:true,totalMmk:true}});if(existing)return NextResponse.json({orderNumber:existing.orderNumber,totalMmk:existing.totalMmk,reused:true});}
  return jsonError(e);
 }
}
