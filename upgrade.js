// upgrade.js

// Initialize Firebase Firestore
const db = firebase.firestore();

// Variable to store user email after first retrieval
let userEmail = '';

// Firebase Authentication listener
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        try {
            // Fetch the user document once
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                userEmail = userData.email;

                if (!userEmail) {
                    console.error('User email not found in Firestore.');
                    alert('User email not found. Please contact support.');
                    window.location.href = '/course_selection.html';
                    return;
                }

                // Initialize FastSpring Builder with user email
                fastspring.builder.recognize({
                    email: userEmail
                    // Not prepopulating firstName and lastName as per requirements
                });
                debugger;

                console.log(`FastSpring recognized user with email: ${userEmail}`);
            } else {
                console.error('User document does not exist.');
                alert('User data not found. Please contact support.');
                window.location.href = '/course_selection.html';
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('An error occurred. Please try again later.');
            window.location.href = '/course_selection.html';
        }
    } else {
        // If user is not logged in, redirect to home or login page
        window.location.href = '/';
    }
});

// Handle FastSpring Popup Closed Event
function onFSPopupClosed(orderReference) {
    if (orderReference && orderReference.id) {
        console.log("Order Reference ID:", orderReference.id);
        // Firestore is updated via webhook; verify subscription status
        verifySubscription(orderReference.id);
    } else {
        console.log("No order ID. Popup was closed without completing a purchase.");
    }

    // Reset FastSpring Builder
    // fastspring.builder.reset();

    // // Re-recognize the user to ensure email is updated after reset
    // if (userEmail) {
    //     debugger;
    //     fastspring.builder.recognize({
    //         email: userEmail
    //     });
    //     console.log(`FastSpring re-recognized user with email: ${userEmail}`);
    // }
}

// Function to verify subscription status from Firestore
async function verifySubscription(subscriptionId) {
    try {
        // Fetch the subscription document
        const subscriptionDocRef = db.collection('subscriptions').doc(subscriptionId);
        const subscriptionDoc = await subscriptionDocRef.get();

        if (!subscriptionDoc.exists) {
            console.error('Subscription document does not exist.');
            displayErrorMessage();
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
            const userDocRef = db.collection('users').doc(subscriptionData.userId);
            const userDoc = await userDocRef.get();

            if (!userDoc.exists) {
                console.error('User document does not exist.');
                displayErrorMessage();
                return;
            }

            // Optionally, you can further verify if the subscription belongs to the current user
            // Assuming user.uid === subscriptionData.userId
            const currentUser = firebase.auth().currentUser;
            if (currentUser && currentUser.uid === subscriptionData.userId) {
                showSuccessMessage(subscriptionData.plan);
            } else {
                console.error('Subscription does not belong to the current user.');
                displayErrorMessage();
            }
        } else {
            console.error('Subscription verification failed. Status not active or plan invalid.');
            displayErrorMessage();
        }
    } catch (error) {
        console.error('Error verifying subscription:', error);
        displayErrorMessage();
    }
}

// Function to show success message
function showSuccessMessage(planType) {
    const successMessageDiv = document.getElementById('successMessage');
    const subscribedPlanSpan = document.getElementById('subscribedPlan');

    subscribedPlanSpan.textContent = planType === 'Monthly Pro' ? 'Monthly' : 'Yearly';

    successMessageDiv.style.display = 'block';

    // Hide subscription options and action buttons
    const subscriptionOptions = document.querySelector('.row.justify-content-center');
    if (subscriptionOptions) {
        subscriptionOptions.style.display = 'none';
    }

    const actionButtons = document.querySelector('.text-center.mt-4');
    if (actionButtons) {
        actionButtons.style.display = 'none';
    }

    // Hide error message if visible
    const errorMessageDiv = document.getElementById('errorMessage');
    if (errorMessageDiv) {
        errorMessageDiv.style.display = 'none';
    }

    console.log(`Displayed success message for plan: ${planType}`);
}

// Function to display error message
function displayErrorMessage() {
    const errorMessageDiv = document.getElementById('errorMessage');
    const successMessageDiv = document.getElementById('successMessage');

    errorMessageDiv.style.display = 'block';

    // Hide subscription options and action buttons
    const subscriptionOptions = document.querySelector('.row.justify-content-center');
    if (subscriptionOptions) {
        subscriptionOptions.style.display = 'none';
    }

    const actionButtons = document.querySelector('.text-center.mt-4');
    if (actionButtons) {
        actionButtons.style.display = 'none';
    }

    // Hide success message if visible
    if (successMessageDiv) {
        successMessageDiv.style.display = 'none';
    }

    console.log(`Displayed error message: Subscription did not go through.`);
}

// Function to reset the subscription process (allow user to try again)
function resetSubscription() {
    const subscriptionOptions = document.querySelector('.row.justify-content-center');
    const actionButtons = document.querySelector('.text-center.mt-4');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Show subscription options and action buttons
    if (subscriptionOptions) {
        subscriptionOptions.style.display = 'flex';
    }

    if (actionButtons) {
        actionButtons.style.display = 'block';
    }

    // Hide error message
    if (errorMessageDiv) {
        errorMessageDiv.style.display = 'none';
    }

    console.log(`Reset subscription process for user to try again.`);
}

// Function to redirect to course_selection.html
function redirectToCourseSelection() {
    window.location.href = '/course_selection.html';
}

// Function to continue with the free plan
function continueFree() {
    window.location.href = '/course_selection.html';
}

// Function to exit the upgrade page
function exitUpgrade() {
    window.location.href = '/course_selection.html';
}

// Logout function (reuse from course-selection.js)
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = '/';
    }).catch((error) => {
        console.error("Logout failed: ", error);
    });
}
