import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
const HEADERS={ 'Cache-Control':'no-store, private', Pragma:'no-cache', Vary:'Cookie' };
export async function GET(request:NextRequest){
  const parsed=z.string().uuid().safeParse(request.nextUrl.searchParams.get('context_id'));
  if(!parsed.success)return NextResponse.json({error:{code:'INVALID_CONTEXT'}},{status:400,headers:HEADERS});
  const supabase=await createClient(); const {data:claims,error}=await supabase.auth.getClaims();
  if(error||!claims?.claims?.sub)return NextResponse.json({error:{code:'UNAUTHORIZED'}},{status:401,headers:HEADERS});
  if(claims.claims.aal!=='aal2')return NextResponse.json({error:{code:'MFA_REQUIRED'}},{status:403,headers:HEADERS});
  const {data,error:queryError}=await supabase.rpc('get_customer_dashboard',{p_context_id:parsed.data});
  if(queryError)return NextResponse.json({error:{code:queryError.code==='42501'?'CONTEXT_ACCESS_DENIED':'DASHBOARD_QUERY_FAILED'}},{status:queryError.code==='42501'?403:500,headers:HEADERS});
  return NextResponse.json(data,{headers:HEADERS});
}
