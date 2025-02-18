<script>
  document.addEventListener("DOMContentLoaded", function() {
    const forms = document.querySelectorAll(".forms");

    forms.forEach(function(form) {
      const submitButton = form.querySelector("input[type='submit']");

      form.addEventListener("submit", function(event) {
        submitButton.value = "Please wait...";
        event.preventDefault();

        const formData = new FormData(form);
        const DataObject = {};

        formData.forEach((value, key) => {
            DataObject[key] = value;
        });

        const formDataObject = {};
        const formName = form.getAttribute('data-name');
        formDataObject.formName = formName;
        formDataObject.formData = DataObject;

        console.log("Form Data Submitted:", formDataObject);

        // Send formDataObject to the external service API
        fetch('https://web-email-service.vercel.app/api/submit-form/67b4a40051d2ec1a6f156a7d', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataObject), // Send the form data as a JSON string
        })
        .then(response => response.json())
        .then(data => {
          console.log('Response from API:', data);
          // Optionally handle the response
        })
        .catch(error => {
          console.error('Error sending data to API:', error);
        });

        setTimeout(function() {
          submitButton.value = "Submit";
        }, 2000);
      });
    });
  });
</script>
