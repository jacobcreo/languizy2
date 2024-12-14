// upgrade-popup.js

// Initialize Firestore
const dbx = firebase.firestore(); // Using dbx to avoid confusion, same as db
let userEmailPopup = '';

// We'll reuse the same logic as upgrade.js, but point to the #upgradeModal elements
// The difference: we don't do window.location.href changes, except to course_selection on success

// Functions to show success/error in the modal
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

function redirectToCourseSelection() {
    window.location.href = '/course_selection.html';
}

function continueFree() {
    // Just close the modal and do nothing special or reload
    const modalElement = document.getElementById('upgradeModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
    console.log("Continuing with the free plan");
}

// Similar logic as in upgrade.js but we adapt variable names (use dbx if needed)
function onFSPopupClosed(orderReference) {
    if (orderReference && orderReference.id) {
        console.log("Order Reference ID:", orderReference.id);
        // Firestore is updated via webhook; verify subscription status
        verifySubscriptionPopup(orderReference.id);
    } else {
        console.log("No order ID. Popup was closed without completing a purchase.");
    }

    // We can optionally reset fastspring builder if needed
    fastspring.builder.reset();

    if (userEmailPopup) {
        fastspring.builder.recognize({
            email: userEmailPopup
        });
        console.log(`FastSpring re-recognized user with email: ${userEmailPopup}`);
    }
}

async function verifySubscriptionPopup(subscriptionId) {
    try {
        const subscriptionDocRef = dbx.collection('subscriptions').doc(subscriptionId);
        const subscriptionDoc = await subscriptionDocRef.get();

        if (!subscriptionDoc.exists) {
            console.error('Subscription document does not exist.');
            displayErrorMessagePopup();
            return;
        }

        const subscriptionData = subscriptionDoc.data();

        if (
            subscriptionData &&
            subscriptionData.plan &&
            (subscriptionData.plan === 'Monthly Pro' || subscriptionData.plan === 'Yearly Pro') &&
            subscriptionData.status === 'active'
        ) {
            const userDocRef = dbx.collection('users').doc(subscriptionData.userId);
            const userDoc = await userDocRef.get();

            if (!userDoc.exists) {
                console.error('User document does not exist.');
                displayErrorMessagePopup();
                return;
            }

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
        fastspring.builder.recognize({ email: userEmailPopup });
        fastspring.builder.checkout({
            products: [{ path: 'monthly-pro' }]
        });
    } else if (planType === 'yearly') {
        // Add yearly-pro item and checkout
        fastspring.builder.recognize({ email: userEmailPopup });
        fastspring.builder.checkout({
            products: [{ path: 'yearly-pro' }]
        });
    }
}

// We must recognize user from Firestore when the popup script loads
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const userDocRef = dbx.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                userEmailPopup = userData.email;
                if (!userEmailPopup) {
                    console.error('User email not found in Firestore.');
                    alert('User email not found. Please contact support.');
                    return;
                }

                console.log(`FastSpring will recognize user with email: ${userEmailPopup} once checkout is triggered.`);
            } else {
                console.error('User document does not exist.');
                alert('User data not found. Please contact support.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('An error occurred. Please try again later.');
        }
    }
});
