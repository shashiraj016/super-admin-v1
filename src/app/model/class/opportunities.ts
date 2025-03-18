export class Opportunities{ 
    opportunity_id: string
        opportunity_name : string
        stage : string
        opportunity_record_type: string
        account_name: string
        close_date: string
        opportunity_currency: string
        VIN: string
        purchase_type: string
        type: string
        sub_type: string
        brand: string
        PMI: string
        description: string
        mobile: string
        phone: string
        email: string
        enquiry_type : string

    constructor (){ 
        this.opportunity_id = ''
        this.stage= ''
        this.opportunity_name = ''
        this.opportunity_record_type= ''
        this.account_name = ''
        this.close_date= ''
        this.opportunity_currency= ''
        this.VIN= ''
        this.purchase_type= ''
        this.type= ''
        this.sub_type= ''
        this.brand= ''
        this.PMI= ''
        this.description= ''
        this.mobile= ''
        this.phone= ''
        this.email= ''
        this.enquiry_type= ''
    }
}