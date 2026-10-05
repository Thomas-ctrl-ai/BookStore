import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const categories = ["Young Learners","Grammar","English Skills","Exam Preparation","IGCSE / O Level / A Level","Stationery"];
  for (const [sortOrder,name] of categories.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    await prisma.category.upsert({where:{slug},create:{slug,name,sortOrder,description:"Browse books and learning materials."},update:{sortOrder}});
  }
  if (!(await prisma.printPricingRule.count())) await prisma.printPricingRule.create({data:{active:false,rateBwA4Mmk:null,rateColorA4Mmk:null,maxFileSizeBytes:10*1024*1024,retentionDays:30}});
  for (const product of [
    {slug:"sample-young-learners",title:"Sample listing · Young learners",categorySlug:"young-learners",featured:true,newArrival:true},
    {slug:"sample-grammar",title:"Sample listing · English grammar",categorySlug:"grammar",featured:true,newArrival:true},
    {slug:"sample-exam-preparation",title:"Sample listing · Exam preparation",categorySlug:"exam-preparation",featured:true,bestseller:true},
    {slug:"sample-stationery",title:"Sample listing · Stationery",categorySlug:"stationery",newArrival:true},
  ]) {
    const category=await prisma.category.findUniqueOrThrow({where:{slug:product.categorySlug}});
    await prisma.product.upsert({where:{slug:product.slug},create:{slug:product.slug,title:product.title,author:"Sample · replace with verified details",description:"Sample listing for development and catalog setup only. Enter the correct book title, description, author, price, stock, and image in Store admin before selling.",priceMmk:0,stock:0,status:"ACTIVE",sampleData:true,tags:["sample"],categoryId:category.id,featured:"featured"in product?product.featured:false,newArrival:"newArrival"in product?product.newArrival:false,bestseller:"bestseller"in product?product.bestseller:false},update:{}});
  }
  if(process.env.ENABLE_ADMIN_SEED==="true"){
    const email=process.env.ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.ADMIN_PASSWORD;
    if(!email||!password||password.length<16)throw new Error("Admin seed enabled: supply ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters). No credentials are set in source code.");
    if(!(await prisma.adminUser.findUnique({where:{email}}))){await prisma.adminUser.create({data:{email,passwordHash:await bcrypt.hash(password,12),role:"ADMIN"}});console.info("Development administrator created for supplied ADMIN_EMAIL. Store the password securely; the seed never logs credentials.");}
  }
  console.info("Store catalog and inactive (unpriced) print defaults are ready.");
}
main().catch(e=>{console.error("Seed failed",e instanceof Error?e.message:"unknown error");process.exitCode=1}).finally(async()=>prisma.$disconnect());
