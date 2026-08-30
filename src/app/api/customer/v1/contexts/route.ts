import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
const HEADERS={ 'Cache-Control':'no-store, private', Pragma:'no-cache', Vary:'Cookie' };
export async function GET(){
  const supabase=await createClient(); const {data:claims,error}=await supabase.auth.getClaims();
  if(error||!claims?.claims?.sub)return NextResponse.json({error:{code:'UNAUTHORIZED'}},{status:401,headers:HEADERS});
  if(claims.claims.aal!=='aal2')return NextResponse.json({error:{code:'MFA_REQUIRED'}},{status:403,headers:HEADERS});
  const {data,error:queryError}=await supabase.rpc('list_my_customer_contexts');
  if(queryError)return NextResponse.json({error:{code:'CONTEXT_QUERY_FAILED'}},{status:500,headers:HEADERS});
  return NextResponse.json({contexts:data??[]},{headers:HEADERS});
}
