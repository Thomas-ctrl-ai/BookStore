"use client";
import {useState} from "react";
import Link from "next/link";
import {useCart} from "@/components/store-provider";
import {Button} from "@/components/ui/button";
export function AddToCart({product,disabled=false}:{product:{productId:string;slug:string;title:string;priceMmk:number;imageUrl:string|null;selectedLevel?:string|null};disabled?:boolean}){const {add}=useCart();const[added,setAdded]=useState(false);return <span className="add-cart-wrap"><Button disabled={disabled} aria-expanded={added} onClick={()=>{add(product);setAdded(true);window.setTimeout(()=>setAdded(false),3500)}}>{disabled?"Unavailable":"Add to bag"}</Button>{added&&<span className="bag-toast" role="status"><strong>Added to your bag</strong>{product.selectedLevel&&<small>Level {product.selectedLevel}</small>}<Link href="/cart" onClick={()=>setAdded(false)}>View bag →</Link><button type="button" aria-label="Dismiss bag confirmation" onClick={()=>setAdded(false)}>×</button></span>}</span>}
