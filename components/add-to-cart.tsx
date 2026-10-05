"use client";
import {useState} from "react";
import {useCart} from "@/components/store-provider";
import {Button} from "@/components/ui/button";
export function AddToCart({product,disabled=false}:{product:{productId:string;slug:string;title:string;priceMmk:number;imageUrl:string|null};disabled?:boolean}){const {add}=useCart();const[added,setAdded]=useState(false);return <Button disabled={disabled} onClick={()=>{add(product);setAdded(true);setTimeout(()=>setAdded(false),1200)}}>{disabled?"Unavailable":added?"Added to your bag ✓":"Add to bag"}</Button>}
