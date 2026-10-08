import "server-only";
import { prisma } from "@/lib/db";
import type { Product } from "@prisma/client";

export type CatalogProduct = Pick<Product, "id" | "title" | "slug" | "author" | "isbn" | "level" | "description" | "priceMmk" | "stock" | "imageUrl" | "tags" | "featured" | "newArrival" | "bestseller" | "sampleData" | "status"> & { category: { name: string; slug: string } };
const fallbackCategories = ["Young Learners", "Grammar", "English Skills", "Exam Preparation", "IGCSE / O Level / A Level", "Stationery"].map((name,index) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g,"-"), name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g,"-"), description: "Explore books and learning materials.", sortOrder:index }));
export const sampleProducts: CatalogProduct[] = [
 {id:"sample-young-reader",slug:"sample-young-reader",title:"Sample title: Young Readers",author:"Sample author",isbn:null,level:null,description:"Illustrative sample listing only. Replace this sample entry with verified book details, images, prices, and availability in the admin catalog before taking orders.",priceMmk:0,stock:0,imageUrl:null,tags:["Sample"],featured:true,newArrival:true,bestseller:false,sampleData:true,status:"ACTIVE" as const,category:{name:"Young Learners",slug:"young-learners"}},
 {id:"sample-grammar",slug:"sample-grammar",title:"Sample title: English Grammar",author:"Sample author",isbn:null,level:null,description:"Illustrative sample listing only. Replace with verified P&K catalog information before taking orders.",priceMmk:0,stock:0,imageUrl:null,tags:["Sample"],featured:false,newArrival:true,bestseller:false,sampleData:true,status:"ACTIVE" as const,category:{name:"Grammar",slug:"grammar"}},
 {id:"sample-exam-prep",slug:"sample-exam-prep",title:"Sample title: Exam Preparation",author:"Sample author",isbn:null,level:null,description:"Illustrative sample listing only. Replace with verified P&K catalog information before taking orders.",priceMmk:0,stock:0,imageUrl:null,tags:["Sample"],featured:false,newArrival:false,bestseller:false,sampleData:true,status:"ACTIVE" as const,category:{name:"Exam Preparation",slug:"exam-preparation"}},
 {id:"sample-stationery",slug:"sample-stationery",title:"Sample product: Stationery",author:null,isbn:null,level:null,description:"Illustrative sample listing only. Replace with the correct product details and price before taking orders.",priceMmk:0,stock:0,imageUrl:null,tags:["Sample"],featured:false,newArrival:false,bestseller:false,sampleData:true,status:"ACTIVE" as const,category:{name:"Stationery",slug:"stationery"}}
];
export async function getCatalog(categorySlug?: string): Promise<CatalogProduct[]> {
  if (!process.env.DATABASE_URL) return sampleProducts.filter(p=>!categorySlug||p.category.slug===categorySlug);
  try { return await prisma.product.findMany({where:{status:"ACTIVE",...(categorySlug?{category:{slug:categorySlug,active:true}}:{})},include:{category:{select:{name:true,slug:true}}},orderBy:[{featured:"desc"},{newArrival:"desc"},{createdAt:"desc"}],take:60}); }
  catch { return sampleProducts.filter(p=>!categorySlug||p.category.slug===categorySlug); }
}
export async function getCategories() { if (!process.env.DATABASE_URL) return fallbackCategories; try { return await prisma.category.findMany({where:{active:true},orderBy:{sortOrder:"asc"},select:{id:true,name:true,slug:true,description:true}}); } catch { return fallbackCategories; } }
export async function getProduct(slug:string): Promise<CatalogProduct|null> { if(!process.env.DATABASE_URL)return sampleProducts.find(p=>p.slug===slug)??null;try {return await prisma.product.findUnique({where:{slug,status:"ACTIVE"},include:{category:{select:{name:true,slug:true}}}});}catch{return sampleProducts.find(p=>p.slug===slug)??null;} }
