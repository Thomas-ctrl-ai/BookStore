"use client";
import {useState} from "react";
import {AddToCart} from "@/components/add-to-cart";

type Product={id:string;slug:string;title:string;priceMmk:number;imageUrl:string|null;levels:string[]};
export function ProductPurchase({product,disabled}:{product:Product;disabled:boolean}){
 const [level,setLevel]=useState("");
 const selectable=product.levels.length>0;
 return <div className="purchase-options">
  {selectable&&<label className="level-picker"><span>Choose a level *</span><select required value={level} onChange={e=>setLevel(e.target.value)}><option value="" disabled>Select a level</option>{product.levels.map(value=><option key={value} value={value}>{value}</option>)}</select></label>}
  <AddToCart disabled={disabled||(selectable&&!level)} product={{productId:product.id,slug:product.slug,title:product.title,priceMmk:product.priceMmk,imageUrl:product.imageUrl,selectedLevel:level||null}}/>
 </div>
}
