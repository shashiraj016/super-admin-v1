export class Tasks {
    task_id: string
  subject: string
  status: string
  priority: any
  assigned_to: string
  due_date: string
  comments: string
  related_to: any
  lead_name: string
  lead_email: string
  lead_code: string
  created_by: string
  created_at: string
  updated_at: string

  constructor(){
    this.task_id = ''
    this.subject = ''
    this.status = ''
    this.priority = ''
    this.assigned_to = ''
    this.due_date = ''
    this.comments = ''
    this.related_to = ''
    this.lead_name = ''
    this.lead_email = ''
    this.lead_code = ''
    this.created_by = ''
    this.created_at = ''
    this.updated_at = ''
  }
}