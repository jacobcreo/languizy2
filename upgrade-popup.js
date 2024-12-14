// upgrade-popup.js

// Initialize Firestore (using the same Firebase instance as course-selection.js)
const dbx = firebase.firestore();

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
function selectPlanFromPopup(planType) {
    // Make sure fastspring.builder is available
    if (typeof fastspring === 'undefined' || typeof fastspring.builder === 'undefined') {
        console.error("FastSpring builder not loaded yet");
        alert("Payment system is not ready. Please try again later.");
        return;
    }

    // Optional: set the origin to match the page from which you're calling
    // fastspring.builder.origin('https://languizy.com/course_selection.html');

    // Clear any previously added items just to be safe
    // fastspring.builder.clear();

    // Add the selected product with quantity = 1 (avoid null if it's causing issues)
    if (planType === 'monthly') {
        fastspring.builder.add({ path: 'monthly-pro', quantity: 1 });
    } else if (planType === 'yearly') {
        fastspring.builder.add({ path: 'yearly-pro', quantity: 1 });
    } else {
        console.error('Unknown plan type:', planType);
        alert('Invalid plan selected. Please try again.');
        return;
    }

    // Now proceed to checkout
    fastspring.builder.checkout();
}


// Function to initiate the upgrade plan (called from course-selection.html)
function initiateUpgradePlan(planType) {
    // Since the user is already recognized and 'upgradeReady' event has been fired,
    // simply trigger the FastSpring checkout
    selectPlanFromPopup(planType);
}

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
                    throw new Error('User email not found.');
                }

                // Recognize the user with FastSpring
                fastspring.builder.recognize({
                    email: userEmailPopup
                    // Not prepopulating firstName and lastName as per requirements
                });
                console.log(`FastSpring recognized user with email: ${userEmailPopup}`);

                // Dispatch a custom event to signal that upgrade is ready
                const event = new CustomEvent('upgradeReady');
                window.dispatchEvent(event);
            } else {
                console.error('User document does not exist.');
                alert('User data not found. Please contact support.');
                throw new Error('User data not found.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('An error occurred while fetching user data.');
            throw error;
        }
    } else {
        console.error('No authenticated user found.');
        alert('No authenticated user found. Please log in again.');
        throw new Error('No authenticated user.');
    }
}

// Expose functions to global scope
window.initiateUpgradePlan = initiateUpgradePlan;
window.onFSPopupClosed = onFSPopupClosed;

// Remove automatic recognition on DOMContentLoaded
// Because course-selection.html will handle calling recognizeUserEmail()
