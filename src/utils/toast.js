export const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = 'toast z-50';
  
  const alert = document.createElement('div');
  let alertClass = 'alert relative flex justify-between items-center';
  let progressClass = 'progress progress-primary w-full absolute top-0 left-0 h-1 rounded-none opacity-70';
  
  if (type === 'success') {
    alertClass += ' bg-green-500 text-white shadow-lg';
  } else if (type === 'error') {
    alertClass += ' bg-red-500 text-white shadow-lg';
  } else if (type === 'warning') {
    alertClass += ' bg-warning text-warning-content shadow-lg';
  } else {
    alertClass += ' bg-blue-500 text-white shadow-lg';
  }
  
  alert.className = alertClass;
  
  const progressBar = document.createElement('progress');
  progressBar.className = progressClass;
  progressBar.value = 100;
  progressBar.max = 100;
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'btn btn-ghost btn-xs';
  closeButton.innerHTML = '<i class="fas fa-times"></i>';
  closeButton.onclick = () => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  };
  
  alert.appendChild(progressBar);
  alert.appendChild(messageSpan);
  alert.appendChild(closeButton);
  toast.appendChild(alert);
  
  document.body.appendChild(toast);
  
  // Force a reflow to ensure the animation plays
  toast.offsetHeight;
  toast.classList.add('show');
  
  // Move existing toasts up
  const existingToasts = document.querySelectorAll('.toast.show');
  existingToasts.forEach(existingToast => {
    if (existingToast !== toast) {
      const currentBottom = parseFloat(getComputedStyle(existingToast).bottom);
      existingToast.style.bottom = `${currentBottom + 0.1}rem`;
    }
  });
  
  // Start the progress bar animation
  const startTime = Date.now();
  const duration = 7000; // 7 seconds
  
  const updateProgress = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
    progressBar.value = remaining;
    
    if (remaining > 0) {
      requestAnimationFrame(updateProgress);
    }
  };
  
  requestAnimationFrame(updateProgress);
  
  // Remove the toast after 7 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    
    // Move remaining toasts down
    const remainingToasts = document.querySelectorAll('.toast.show');
    remainingToasts.forEach(remainingToast => {
      const currentBottom = parseFloat(getComputedStyle(remainingToast).bottom);
      remainingToast.style.bottom = `${currentBottom - 0.1}rem`;
    });
    
    // Remove the element after the animation
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 7000);
};

const createNewToast = (message, type) => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let alertClass = 'alert';
  let icon = '';
  
  if (type === 'success') {
    alertClass += ' bg-green-500 text-white';
    icon = '<i class="fas fa-check-circle text-xl mr-2"></i>';
  } else if (type === 'error') {
    alertClass += ' bg-red-100 text-red-800';
    icon = '<i class="fas fa-exclamation-circle text-xl mr-2"></i>';
  } else if (type === 'warning') {
    alertClass += ' bg-yellow-100 text-yellow-800';
    icon = '<i class="fas fa-exclamation-triangle text-xl mr-2"></i>';
  }
  
  toast.innerHTML = `
    <div class="${alertClass} flex justify-between items-center">
      <div class="flex items-center">
        ${icon}
        <span>${message}</span>
      </div>
      <button class="btn btn-ghost btn-xs ml-4" onclick="this.closest('.toast').classList.remove('show'); setTimeout(() => this.closest('.toast').remove(), 300)">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // Remove toast after 7 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 7000);
}; 