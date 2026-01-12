import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minMagnitude = searchParams.get('minMagnitude');
    const maxMagnitude = searchParams.get('maxMagnitude');
    const county = searchParams.get('county');
    const year = searchParams.get('year');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('hail_storms')
      .select('*')
      .order('begin_date', { ascending: false })
      .limit(parseInt(limit || '100'));

    if (startDate) query = query.gte('begin_date', startDate);
    if (endDate) query = query.lte('begin_date', endDate);
    if (minMagnitude) query = query.gte('magnitude', parseFloat(minMagnitude));
    if (maxMagnitude) query = query.lte('magnitude', parseFloat(maxMagnitude));
    if (county) query = query.ilike('cz_name', `%${county}%`);
    if (year) query = query.eq('year', parseInt(year));

    const { data, error, status } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: status || 400 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
