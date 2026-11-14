from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / 'seed-data/source-import.json').read_text(encoding='utf-8'))

def sql_text(value):
    return "'" + str(value if value is not None else '').replace("'", "''") + "'"

def sql_json(value):
    return sql_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'))) + '::jsonb'

lines = [
    '-- Source-derived JRT Mart seed data from both uploaded HTML references.',
    '-- This file imports category taxonomy, initial page shells, homepage sections and public store settings.',
    '-- No product prices, inventory or SKUs are fabricated. Run once after schema.sql; later admin edits are retained.',
    'begin;',
]
for c in DATA['categories']:
    cols = ['legacy_id','name','slug','group_key','group_name','icon','image_url','description','sort_order','is_active']
    vals = [str(c['legacy_id']),sql_text(c['name']),sql_text(c['slug']),sql_text(c['group_key']),sql_text(c['group_name']),sql_text(c['icon']),('null' if not c.get('image_url') else sql_text(c['image_url'])),sql_text(c.get('description','')),str(c['sort_order']),'true']
    lines.append(f"insert into public.categories({','.join(cols)}) values ({','.join(vals)}) on conflict(slug) do update set name=excluded.name,group_key=excluded.group_key,group_name=excluded.group_name,icon=excluded.icon,image_url=excluded.image_url,description=excluded.description,sort_order=excluded.sort_order;")
for p in DATA['pages']:
    lines.append("insert into public.site_pages(slug,title,meta_title,meta_description,is_published,sort_order) values ("+
        ','.join([sql_text(p['slug']),sql_text(p['title']),sql_text(p.get('meta_title') or p['title']),sql_text(p.get('meta_description','')),'true' if p.get('is_published') else 'false',str(p.get('sort_order',100))])+
        ") on conflict(slug) do nothing;")
for sec in DATA['sections']:
    cols=['page_slug','section_key','section_type','eyebrow','title','body','image_url','cta_label','cta_url','content','sort_order','is_visible']
    vals=[sql_text(sec['page_slug']),sql_text(sec['section_key']),sql_text(sec['section_type']),sql_text(sec.get('eyebrow','')),sql_text(sec.get('title','')),sql_text(sec.get('body','')),('null' if not sec.get('image_url') else sql_text(sec['image_url'])),sql_text(sec.get('cta_label','')),sql_text(sec.get('cta_url','')),sql_json(sec.get('content',{})),str(sec.get('sort_order',100)),'true' if sec.get('is_visible',True) else 'false']
    lines.append(f"insert into public.site_sections({','.join(cols)}) values ({','.join(vals)}) on conflict(page_slug,section_key) do nothing;")
for key, value in DATA['settings'].items():
    lines.append(f"insert into public.store_settings(key,value,is_public) values ({sql_text(key)},{sql_json(value)},true) on conflict(key) do nothing;")
pay = DATA.get('payment',{})
cols=['id','provider','gateway_enabled','mode','currency','manual_payment_enabled','bank_account_name','bank_name','bank_account_number','bank_ifsc','bank_branch','upi_id','instructions']
vals=['1',sql_text(pay.get('provider','razorpay')),'true' if pay.get('gateway_enabled') else 'false',sql_text(pay.get('mode','test')),sql_text(pay.get('currency','INR')),'true' if pay.get('manual_payment_enabled',True) else 'false']
for key in ['bank_account_name','bank_name','bank_account_number','bank_ifsc','bank_branch','upi_id','instructions']:
    vals.append(sql_text(pay.get(key,'')))
lines.append(f"insert into public.payment_settings({','.join(cols)}) values ({','.join(vals)}) on conflict(id) do nothing;")
lines += [
    '-- First staff account must be created in Supabase Auth and explicitly added to public.admin_users.',
    "-- Example: insert into public.admin_users(user_id, role) values ('<AUTH-USER-UUID>','owner');",
    'commit;',
]
(ROOT/'supabase/seed.sql').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print(f"Wrote supabase/seed.sql: {len(DATA['categories'])} categories, {len(DATA['pages'])} pages, {len(DATA['sections'])} sections, {len(DATA['settings'])} public settings.")
