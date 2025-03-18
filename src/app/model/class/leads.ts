export class Leads{ 
    lead_id: string
    lead_code: string
    dealer_name: string
    dealer_code: string
    status: string
    purchase_type: string
    type: string
    sub_type: string
    brand: string
    PMI: string
    lead_source: string
    lname: string 
    mobile: string 
    lead_owner: string
    owner_acc_id: string
    enquiry_type: string 
    phone: null
    email:  string 
    flag : string 

    constructor (){ 
        this.flag = ''
    this.lead_id = ''
    this.phone= null
    this.email=  ''
    this.lead_owner=  ''
    this.owner_acc_id= '' 
    this.enquiry_type= ''
    this.lead_code = ''
    this.dealer_name = ''
    this.dealer_code = ''
    this.status = ''
    this.purchase_type = ''
    this.type = ''
    this.sub_type = ''
    this.brand = ''
    this.PMI = ''
    this.lead_source = ''
    this.lname = '' 
    this.mobile = '' 
    this.lead_owner = ''
    this.owner_acc_id = ''
    this.enquiry_type = '' 
    }
}