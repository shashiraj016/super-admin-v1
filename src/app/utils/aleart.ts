 
export function showAlert(type: string, message: string) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
       <span class="alert-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
        </svg>
      </span>
      <strong>${type.charAt(0).toUpperCase() + type.slice(1)}!</strong> ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span>&times;</span>
      </button>

    `;
    document.body.appendChild(alertDiv);
  
    setTimeout(() => alertDiv.classList.remove('show'), 3000); // Auto-dismiss after 3 seconds
  }
  