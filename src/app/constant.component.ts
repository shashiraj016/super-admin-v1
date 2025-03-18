export const hostport = 'http://122.170.5.148:3001/api-docs/';

export const Alert = {
  emailId: 'Please provide a correct email address.',
  passwordLength: 'Password must have at least 8 characters.',
  add: 'Data Added.',
  imageRequired: 'Image Required.',
  delete: 'Data Deleted.',
  update: 'Data Updated',
  active: 'Data Activated',
  alreadyExits: 'Data Already Exists',
  AccountDeactive: 'Your account is not activated please contact support team.',
};
declare const $: any;
export const table = () => {
  setTimeout(() => {
    $('#adminTable').DataTable({
      dom: 'Bfrtip',
      scrollX: false,
      destroy: true,
      retrieve: true,
      filter: true,
      pagingType: 'full_numbers',
      pageLength: 10,
      lengthChange: true,
      processing: true,
      buttons: ['excel', 'print', 'pdf', 'csv'],
    });
    $('#adminTable2').DataTable({
      dom: 'Bfrtip',
      scrollX: false,
      destroy: true,
      retrieve: true,
      filter: true,
      pagingType: 'full_numbers',
      pageLength: 10,
      lengthChange: true,
      processing: true,
      bFilter: false,
      buttons: ['excel', 'print', 'pdf', 'csv'],
    });
  });
};

export const destroyTable = () => {
  $('#adminTable').DataTable().destroy();
  $('#adminTable2').DataTable().destroy();
};
