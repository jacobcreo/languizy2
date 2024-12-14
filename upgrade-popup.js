// upgrade-popup.js

// Initialize Firestore (using the same Firebase instance as course-selection.js)
const dbx = firebase.firestore(); // Using dbx to avoid confusion

// Variable to store user email
let userEmailPopup = '';

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
    modalInstance.hide();
    console.log("Continuing with the free plan");
}

// Handle FastSpring Popup Closed Event
function onFSPopupClosed(orderReference) {
    if (orderReference && orderReference.id) {
        console.log("Order Reference ID:", orderReference.id);
        // Firestore is updated via webhook; verify subscription status
        verifySubscriptionPopup(orderReference.id);
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
            // Assuming user.uid === subscriptionData.userId
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

// Function to handle plan selection from popup
// This mirrors the logic from upgrade.js but triggers the FastSpring checkout popup.
function selectPlanFromPopup(planType) {
    // Make sure fastspring.builder is available
    if (typeof fastspring === 'undefined' || typeof fastspring.builder === 'undefined') {
        console.error("FastSpring builder not loaded yet");
        return;
    }

    // This function triggers the FastSpring checkout
    // We'll rely on fastspring.builder to show the popup:
    if (planType === 'monthly') {
        // Add monthly-pro item and checkout
        fastspring.builder.checkout({
            products: [{ path: 'monthly-pro' }]
        });
    } else if (planType === 'yearly') {
        // Add yearly-pro item and checkout
        fastspring.builder.checkout({
            products: [{ path: 'yearly-pro' }]
        });
    }
}

// Function to initiate the upgrade plan (called from course-selection.html)
function initiateUpgradePlan(planType) {
    // Trigger FastSpring checkout
    selectPlanFromPopup(planType);
}

// Function to recognize the user email using currentUser
function recognizeUserEmail() {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        const userDocRef = dbx.collection('users').doc(currentUser.uid);
        userDocRef.get().then((userDoc) => {
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
                    // Not prepopulating firstName and lastName as per requirements
                });
                console.log(`FastSpring recognized user with email: ${userEmailPopup}`);
            } else {
                console.error('User document does not exist.');
                alert('User data not found. Please contact support.');
            }
        }).catch((error) => {
            console.error('Error fetching user data:', error);
            alert('An error occurred. Please try again later.');
        });
    } else {
        console.error('No authenticated user found.');
        alert('No authenticated user found. Please log in again.');
    }
}

// Automatically recognize the user when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if FastSpring builder is loaded
    if (typeof fastspring !== 'undefined' && typeof fastspring.builder !== 'undefined') {
        recognizeUserEmail();
    } else {
        // Wait for FastSpring builder to load
        window.addEventListener('fsbuilderloaded', () => {
            recognizeUserEmail();
        });
    }
});
