import type{Metadata}from"next";import{getAdmin}from"@/lib/auth";import{AdminLogin}from"@/components/admin-login";import{AdminConsole}from"@/components/admin-console";
export const metadata:Metadata={title:"Store admin"};export const dynamic="force-dynamic";
export default async function AdminPage(){const admin=await getAdmin();return admin?<AdminConsole email={admin.email}/>:<AdminLogin/>}
