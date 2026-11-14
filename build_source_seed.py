from bs4 import BeautifulSoup
from pathlib import Path
import json,re,html,urllib.parse
root=Path(__file__).resolve().parent
app=(root/'app.js').read_text(encoding='utf8')
block=re.search(r'(?:const|let) categoryRows\s*=\s*\[(.*?)\]\s*\.map',app,re.S).group(1)
rows=[]
for cid,name,group in re.findall(r'\[(\d+)\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"([^"]+)"\]',block):
    name=bytes(name,'utf8').decode('unicode_escape')
    rows.append({'legacy_id':int(cid),'name':name,'slug':re.sub(r'[^a-z0-9]+','-',name.lower().replace('&',' ')).strip('-'),'group_key':group,'group_name':group.replace('-',' ').title(),'icon':{'apparel':'👕','uniforms':'🦺','bags':'🎒','home':'🏠','kitchen':'🍳','appliances':'🔌','gifting':'🎁'}.get(group,'📦'),'image_url':None,'sort_order':len(rows)+1,'is_active':True})

jrt=BeautifulSoup((root/'reference/jrt-mart-original.html').read_text(encoding='utf8'),'html.parser')
fact=BeautifulSoup((root/'reference/factori-original.html').read_text(encoding='utf8'),'html.parser')
# Add category image URLs from the clean Factori CDN source, matched by the visible category label.
image_by_name={}
for a in fact.select('#shop-categories a.tile'):
    label=a.select_one('.tn')
    img=a.find('img')
    if label and img and img.get('src'):
        image_by_name[label.get_text(' ',strip=True).lower()]=img['src']
for c in rows:
    c['image_url']=image_by_name.get(c['name'].lower())

hero=jrt.select_one('section.hero')
hero_title=hero.find('h1').get_text(' ',strip=True) if hero and hero.find('h1') else 'Wholesale products for every business.'
hero_desc=hero.find('p').get_text(' ',strip=True) if hero and hero.find('p') else ''
hero_eyebrow=hero.select_one('.eyebrow')
hero_ctas=[{'label':'Browse products','url':'/products?avail=ready'},{'label':'Start contract manufacturing','url':'/get-quote'}]

# Extract FAQ Q/A from source, keeping all original answers as editable plain text.
faq_section=None
for sec in jrt.find_all('section'):
    h=sec.find(['h2','h3'])
    if h and 'Frequently asked questions' in h.get_text(' ',strip=True):
        faq_section=sec; break
faqs=[]
if faq_section:
    for d in faq_section.find_all('details'):
        sm=d.find('summary')
        body=d.select_one('.answer-body') or d
        paras=[p.get_text(' ',strip=True) for p in body.find_all(['p','li']) if p.get_text(' ',strip=True)]
        if sm:
            faqs.append({'question':sm.get_text(' ',strip=True),'answer':'\n\n'.join(paras) if paras else body.get_text(' ',strip=True)})

# Main manufacturing section copy and its steps.
man=jrt.find(id='manufacture')
man_data={}
if man:
    man_data['eyebrow']=(man.select_one('.k') or man).get_text(' ',strip=True)
    man_data['title']=(man.find('h2') or man.find('h1')).get_text(' ',strip=True) if (man.find('h2') or man.find('h1')) else 'Made to order. Your brand, your specification.'
    man_data['body']='\n\n'.join(p.get_text(' ',strip=True) for p in man.find_all('p') if p.get_text(' ',strip=True))
    man_data['steps']=[{'title':(x.find(['b','strong']) or x).get_text(' ',strip=True),'body':x.get_text(' ',strip=True)} for x in man.select('.stp')]
    man_data['cta']=[{'label':a.get_text(' ',strip=True),'url':a.get('href','/get-quote')} for a in man.find_all('a') if a.get_text(' ',strip=True)]

# Generic section extraction.
def sec_with_heading(needle):
    for sec in jrt.find_all('section'):
        h=sec.find(['h2','h3'])
        if h and needle.lower() in h.get_text(' ',strip=True).lower(): return sec
    return None

def text(el): return el.get_text(' ',strip=True) if el else ''

# Clients / logos from Factori file (clean image URLs), retaining alt/name labels.
clients=[]
for a in fact.select('section .logos a.lg'):
    img=a.find('img')
    if img:
        clients.append({'name':img.get('alt') or img.get('title') or 'Client','image_url':img.get('src')})

# Offerings
offer_sec=sec_with_heading('Three offerings')
offerings=[]
if offer_sec:
    for item in offer_sec.select('.of'):
        offerings.append({'title':text(item.find('b') or item.find('strong')),'body':text(item.find('p')),'bullets':[li.get_text(' ',strip=True) for li in item.find_all('li')],'cta':({'label':text(item.select_one('a.go')),'url':item.select_one('a.go').get('href')} if item.select_one('a.go') else None)})

# Credentials
cred_sec=sec_with_heading('Our credentials')
credentials=[]
if cred_sec:
    for item in cred_sec.select('.cr'):
        credentials.append({'title':text(item.find(['b','strong']) or item.find(['h3','h4'])),'body':text(item.find('p')) or item.get_text(' ',strip=True)})
    if not credentials:
        credentials=[{'title':text(x.find(['b','strong'])),'body':x.get_text(' ',strip=True)} for x in cred_sec.find_all(['li','div']) if x.find(['b','strong'])]

# Values
value_sec=sec_with_heading('Our values')
values=[]
if value_sec:
    for item in value_sec.select('.vl'):
        values.append({'title':text(item.find(['b','strong','h3','h4'])),'body':text(item.find('p')) or item.get_text(' ',strip=True)})

# Media centre cards.
media_sec=sec_with_heading('Media centre')
media=[]
if media_sec:
    for item in media_sec.select('.mc'):
        heading=item.find(['h3','h4','b','strong'])
        a=item.find('a',href=True)
        img=item.find('img')
        media.append({'title':text(heading) or text(a),'body':text(item.find('p')),'url':a.get('href') if a else '/contact-us','image_url':img.get('src') if img else None})

# Trust footer highlights
trust=jrt.select_one('section.ftrust')
trust_items=[]
if trust:
    for item in trust.find_all(['div','li'],recursive=True):
        t=text(item)
        if t and len(t)<260 and len(t)>12 and len(item.find_all(['div','li'],recursive=False))==0:
            trust_items.append({'title':t})
trust_items=trust_items[:8]

# Category group descriptions from the source's feature sections.
group_sections=[]
for sec in jrt.select('#shop-categories .catsec'):
    h=sec.find(['h2','h3'])
    p=sec.select_one('.cd') or sec.find('p')
    if h:
        group_sections.append({'title':text(h),'body':text(p),'group_key':sec.get('id') or ''})

# FAQ and sections to edit in admin. These seed rows form the editable homepage.
sections=[
 {'page_slug':'home','section_key':'hero','section_type':'hero','eyebrow':text(hero_eyebrow) or 'Wholesale · Business supply · Custom manufacturing','title':hero_title,'body':hero_desc,'image_url':None,'cta_label':hero_ctas[0]['label'] if hero_ctas else 'Browse products','cta_url':hero_ctas[0]['url'] if hero_ctas else '/products','content':{'buttons':hero_ctas,'source':'JRT-MART-SUPABASE-COMPLETE.html'},'sort_order':10,'is_visible':True},
 {'page_slug':'home','section_key':'trust-strip','section_type':'trust_strip','eyebrow':'Why businesses choose JRT Mart','title':'Supply with confidence','body':'','content':{'items':trust_items or [{'title':'GST invoice on every order'},{'title':'Dispatch within 24 hours on ready stock'},{'title':'No substitutions without approval'}]},'sort_order':20,'is_visible':True},
 {'page_slug':'home','section_key':'categories','section_type':'category_grid','eyebrow':'Explore the catalogue','title':'Shop by category','body':'116 categories across apparel, uniforms, bags, home essentials, kitchen, appliances and corporate gifting.','content':{'source_group_descriptions':group_sections},'sort_order':30,'is_visible':True},
 {'page_slug':'home','section_key':'manufacturing','section_type':'manufacturing','eyebrow':man_data.get('eyebrow','Contract manufacturing at any scale'),'title':man_data.get('title','Made to order. Your brand, your specification.'),'body':man_data.get('body',''),'content':{'steps':man_data.get('steps',[]),'buttons':man_data.get('cta',[])},'sort_order':40,'is_visible':True},
 {'page_slug':'home','section_key':'clients','section_type':'clients','eyebrow':'Trusted by organisations','title':'Trusted by governments, institutions & global brands','body':'Organisations buy from JRT Mart across e-commerce, retail, space & defence, technology, healthcare, banking, energy and logistics.','content':{'logos':clients},'sort_order':50,'is_visible':True},
 {'page_slug':'home','section_key':'offerings','section_type':'offerings','eyebrow':'Three offerings. One integrated platform.','title':'All built on the same manufacturing and fulfilment backbone','body':'','content':{'cards':offerings},'sort_order':60,'is_visible':True},
 {'page_slug':'home','section_key':'credentials','section_type':'credentials','eyebrow':'Our credentials','title':'Registered, verified, accountable','body':'','content':{'items':credentials},'sort_order':70,'is_visible':True},
 {'page_slug':'home','section_key':'values','section_type':'values','eyebrow':'Our values','title':'What every order is held to','body':'','content':{'items':values},'sort_order':80,'is_visible':True},
 {'page_slug':'home','section_key':'media','section_type':'media','eyebrow':'Media centre','title':'Latest from JRT Mart','body':'Insights and updates from the JRT Mart team.','content':{'items':media},'sort_order':90,'is_visible':False},
 {'page_slug':'home','section_key':'faqs','section_type':'faq','eyebrow':'Frequently asked questions','title':'Straight answers','body':'','content':{'items':faqs},'sort_order':100,'is_visible':True},
 {'page_slug':'home','section_key':'final-cta','section_type':'cta','eyebrow':'Ready to source?','title':'Have a volume or custom requirement?','body':'Tell us what you need, how many pieces and when you need them. The team will help you choose the right supply model.','cta_label':'Request a quote','cta_url':'/get-quote','content':{},'sort_order':110,'is_visible':True}
]

pages=[
 {'slug':'home','title':'JRT Mart | Wholesale, Retail & Business Supply','meta_description':'Wholesale products, business supplies, apparel, uniforms, bags, home essentials and corporate gifting from JRT Mart.','is_published':True,'sort_order':1},
 {'slug':'about-us','title':'About JRT Mart','meta_description':'Learn about JRT Mart and our wholesale, retail and manufacturing supply platform.','is_published':True,'sort_order':2},
 {'slug':'contract-manufacturing','title':'Contract manufacturing','meta_description':'Custom contract manufacturing for apparel, uniforms, bags and corporate merchandise.','is_published':True,'sort_order':3},
 {'slug':'shipping-policy','title':'Shipping policy','meta_description':'JRT Mart shipping and delivery information.','is_published':True,'sort_order':20},
 {'slug':'warranty-and-refund-policy','title':'Warranty & refund policy','meta_description':'JRT Mart returns, replacements and refund information.','is_published':True,'sort_order':21},
 {'slug':'pricing-and-payments-policy','title':'Pricing & payments policy','meta_description':'JRT Mart pricing, GST, invoicing and payment terms.','is_published':True,'sort_order':22},
 {'slug':'privacy-policy','title':'Privacy policy','meta_description':'How JRT Mart uses and protects customer information.','is_published':True,'sort_order':23},
 {'slug':'terms-and-conditions','title':'Terms & conditions','meta_description':'Terms governing use of the JRT Mart website and orders.','is_published':True,'sort_order':24},
 {'slug':'contact-us','title':'Contact JRT Mart','meta_description':'Contact JRT Mart for orders, quotes and business supply enquiries.','is_published':True,'sort_order':25},
]

settings={
 'store_name':'JRT Mart','store_tagline':'WHOLESALE • RETAIL • BUSINESS','footer_text':'Wholesale products, business essentials, custom manufacturing and corporate supply.','support_email':'','support_phone':'','business_address':'','gstin':'','currency':'INR','locale':'en-IN','seo_title':'JRT Mart | Wholesale, Retail & Business Supply','seo_description':'Shop wholesale products, business supplies, apparel, uniforms, bags and corporate gifting at JRT Mart.','logo_url':'','announcement':'','shipping_mode':'quote','shipping_flat_rate':'0','free_shipping_threshold':'','shipping_note':'Shipping and applicable GST are confirmed on the final quotation or invoice.','tax_note':'Prices and GST treatment must be confirmed on your quotation.','facebook_url':'','instagram_url':'','linkedin_url':'','youtube_url':''
}

out={'generated_from':['reference/jrt-mart-original.html','reference/factori-original.html'],'source_brand':'JRT Mart','categories':rows,'pages':pages,'sections':sections,'settings':settings,'payment':{'provider':'razorpay','gateway_enabled':False,'mode':'test','currency':'INR','manual_payment_enabled':True,'bank_account_name':'','bank_name':'','bank_account_number':'','bank_ifsc':'','bank_branch':'','upi_id':'','instructions':'Online payments will be enabled after Razorpay credentials and webhook verification are configured.'}}
(root/'seed-data/source-import.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print('categories',len(rows),'sections',len(sections),'faqs',len(faqs),'clients',len(clients),'group descriptions',len(group_sections),'offerings',len(offerings),'credentials',len(credentials),'values',len(values))
