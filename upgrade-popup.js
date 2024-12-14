// upgrade-popup.js

// Ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firestore (using the same Firebase instance as course-selection.js)
    const dbx = firebase.firestore();

    // Variable to store user email
    let userEmailPopup = '';

    // Function to recognize the user email using currentUser
    async function recognizeUserEmail() {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            try {
                const userDocRef = dbx.collection('users').doc(currentUser.uid);
                const userDoc = await userDocRef.get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    userEmailPopup = userData.email;
                    if (!userEmailPopup) {
                        console.error('User email not found in Firestore.');
                        alert('User email not found. Please contact support.');
                        return;
                    }

                    // Recognize the user with FastSpring
                    fastspring.builder.recognize({
                        email: userEmailPopup
                        // Optionally, add other recognized fields if needed
                    });
                    console.log(`FastSpring recognized user with email: ${userEmailPopup}`);

                    // Display the upgrade buttons now that the user is recognized
                    displayUpgradeButtons();
                } else {
                    console.error('User document does not exist.');
                    alert('User data not found. Please contact support.');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                alert('An error occurred while fetching user data.');
            }
        } else {
            console.error('No authenticated user found.');
            alert('No authenticated user found. Please log in again.');
        }
    }

    // Function to display upgrade buttons after recognition
    function displayUpgradeButtons() {
        const monthlyPlanBtn = document.getElementById('monthlyPlanBtn');
        const yearlyPlanBtn = document.getElementById('yearlyPlanBtn');

        if (monthlyPlanBtn && yearlyPlanBtn) {
            monthlyPlanBtn.style.display = 'inline-block';
            yearlyPlanBtn.style.display = 'inline-block';
            console.log("Upgrade plan buttons are now visible.");
        } else {
            console.error("Upgrade plan buttons not found in the DOM.");
        }
    }

    // Handle FastSpring Popup Closed Event
    window.onFSPopupClosed = async function (orderReference) {
        if (orderReference && orderReference.id) {
            console.log("Order Reference ID:", orderReference.id);
            // Firestore is updated via webhook; verify subscription status
            await verifySubscriptionPopup(orderReference.id);
        } else {
            console.log("No order ID. Popup was closed without completing a purchase.");
        }

        // Reset FastSpring Builder
        fastspring.builder.reset();

        // Re-recognize the user to ensure email is updated after reset
        if (userEmailPopup) {
            fastspring.builder.recognize({
                email: userEmailPopup
            });
            console.log(`FastSpring re-recognized user with email: ${userEmailPopup}`);
        }
    }

    // Function to verify subscription status from Firestore
    async function verifySubscriptionPopup(subscriptionId) {
        try {
            // Fetch the subscription document
            const subscriptionDocRef = dbx.collection('subscriptions').doc(subscriptionId);
            const subscriptionDoc = await subscriptionDocRef.get();

            if (!subscriptionDoc.exists) {
                console.error('Subscription document does not exist.');
                displayErrorMessagePopup();
                return;
            }

            const subscriptionData = subscriptionDoc.data();

            // Verify the subscription details
            if (
                subscriptionData &&
                subscriptionData.plan &&
                (subscriptionData.plan === 'Monthly Pro' || subscriptionData.plan === 'Yearly Pro') &&
                subscriptionData.status === 'active'
            ) {
                // Fetch the user document to update UI
                const userDocRef = dbx.collection('users').doc(subscriptionData.userId);
                const userDoc = await userDocRef.get();

                if (!userDoc.exists) {
                    console.error('User document does not exist.');
                    displayErrorMessagePopup();
                    return;
                }

                // Optionally, you can further verify if the subscription belongs to the current user
                // Assuming currentUser.uid === subscriptionData.userId
                const currentUser = firebase.auth().currentUser;
                if (currentUser && currentUser.uid === subscriptionData.userId) {
                    showSuccessMessagePopup(subscriptionData.plan);
                } else {
                    console.error('Subscription does not belong to the current user.');
                    displayErrorMessagePopup();
                }
            } else {
                console.error('Subscription verification failed. Status not active or plan invalid.');
                displayErrorMessagePopup();
            }
        } catch (error) {
            console.error('Error verifying subscription:', error);
            displayErrorMessagePopup();
        }
    }

    // Function to show success message inside the upgradeModal
    function showSuccessMessagePopup(planType) {
        const successMessageDiv = document.getElementById('upgradeSuccessMessage');
        const subscribedPlanSpan = document.getElementById('subscribedPlan');

        subscribedPlanSpan.textContent = planType === 'Monthly Pro' ? 'Monthly' : 'Yearly';

        successMessageDiv.style.display = 'block';

        // Hide subscription options and action buttons inside the modal
        const modalBody = successMessageDiv.closest('.modal-content').querySelector('.modal-body');
        if (modalBody) {
            const subscriptionTable = modalBody.querySelector('table');
            const alertInfo = modalBody.querySelector('.alert-info');
            if (subscriptionTable) subscriptionTable.style.display = 'none';
            if (alertInfo) alertInfo.style.display = 'none';
            // Also hide the plan selection buttons from the modal-footer
            const modalFooter = successMessageDiv.closest('.modal-content').querySelector('.modal-footer');
            if (modalFooter) modalFooter.style.display = 'none';
        }

        // Hide error message if visible
        const errorMessageDiv = document.getElementById('upgradeErrorMessage');
        if (errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
        }

        console.log(`Displayed success message for plan: ${planType}`);
    }

    // Function to show error message inside the upgradeModal
    function displayErrorMessagePopup() {
        const errorMessageDiv = document.getElementById('upgradeErrorMessage');
        const successMessageDiv = document.getElementById('upgradeSuccessMessage');

        errorMessageDiv.style.display = 'block';

        // Hide subscription options and action buttons inside the modal
        const modalBody = errorMessageDiv.closest('.modal-content').querySelector('.modal-body');
        if (modalBody) {
            const subscriptionTable = modalBody.querySelector('table');
            const alertInfo = modalBody.querySelector('.alert-info');
            if (subscriptionTable) subscriptionTable.style.display = 'none';
            if (alertInfo) alertInfo.style.display = 'none';
            // Also hide the plan selection buttons from the modal-footer
            const modalFooter = errorMessageDiv.closest('.modal-content').querySelector('.modal-footer');
            if (modalFooter) modalFooter.style.display = 'none';
        }

        // Hide success message if visible
        if (successMessageDiv) {
            successMessageDiv.style.display = 'none';
        }

        console.log(`Displayed error message: Subscription did not go through.`);
    }

    // Function to reset the subscription process (allow user to try again)
    function resetSubscription() {
        // Show subscription options and action buttons again
        const modalBody = document.querySelector('#upgradeModal .modal-body');
        if (modalBody) {
            const subscriptionTable = modalBody.querySelector('table');
            const alertInfo = modalBody.querySelector('.alert-info');
            if (subscriptionTable) subscriptionTable.style.display = 'table';
            if (alertInfo) alertInfo.style.display = 'block';
        }

        const modalFooter = document.querySelector('#upgradeModal .modal-footer');
        if (modalFooter) modalFooter.style.display = 'flex';

        // Hide error message
        const errorMessageDiv = document.getElementById('upgradeErrorMessage');
        if (errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
        }

        console.log(`Reset subscription process for user to try again.`);
    }

    // Function to redirect to course_selection.html after successful subscription
    function redirectToCourseSelection() {
        window.location.href = '/course_selection.html';
    }

    // Function to continue with the free plan
    function continueFree() {
        // Just close the modal and do nothing special or reload
        const modalElement = document.getElementById('upgradeModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
            console.log("Continuing with the free plan");
        }
    }

    // Automatically recognize the user when the modal is shown
    const upgradeModal = document.getElementById('upgradeModal');
    if (upgradeModal) {
        upgradeModal.addEventListener('shown.bs.modal', function () {
            recognizeUserEmail();
        });
    } else {
        console.error('upgradeModal not found in the DOM.');
    }
});
