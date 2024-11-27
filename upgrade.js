// upgrade.js

// Initialize Firebase Firestore
const db = firebase.firestore();

// Firebase Authentication listener
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        try {
            // Fetch the user document
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                const userEmail = userData.email;

                if (!userEmail) {
                    console.error('User email not found in Firestore.');
                    alert('User email not found. Please contact support.');
                    window.location.href = '/course-selection.html';
                    return;
                }

                // Initialize FastSpring Builder with user email
                fastspring.builder.recognize({
                    email: userEmail
                    // Not prepopulating firstName and lastName as per requirements
                });

                console.log(`FastSpring recognized user with email: ${userEmail}`);
            } else {
                console.error('User document does not exist.');
                alert('User data not found. Please contact support.');
                window.location.href = '/course-selection.html';
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('An error occurred. Please try again later.');
            window.location.href = '/course-selection.html';
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
        // Optionally, you can verify the order on your server here

        // Update Firestore to reflect the subscription
        updateUserSubscription(orderReference);
    } else {
        console.log("No order ID. Popup was closed without completing a purchase.");
    }

    // Reset FastSpring Builder
    fastspring.builder.reset();

    // Re-recognize the user to ensure email is updated after reset
    const user = firebase.auth().currentUser;
    if (user) {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const userEmail = userData.email;
                if (userEmail) {
                    fastspring.builder.recognize({
                        email: userEmail
                    });
                    console.log(`FastSpring re-recognized user with email: ${userEmail}`);
                }
            }
        }).catch((error) => {
            console.error('Error re-recognizing user:', error);
        });
    }
}

// Function to update user's subscription in Firestore
async function updateUserSubscription(orderReference) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('No user is currently logged in.');
            return;
        }

        // Fetch the user document
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            console.error('User document does not exist.');
            return;
        }

        const userData = userDoc.data();
        const subscriptionId = orderReference.id; // Assuming orderReference.id is the subscription ID

        // Fetch the subscription document to determine the plan type
        const subscriptionDocRef = db.collection('subscriptions').doc(subscriptionId);
        const subscriptionDoc = await subscriptionDocRef.get();

        if (!subscriptionDoc.exists) {
            console.error('Subscription document does not exist.');
            // Optionally, handle this case by alerting the user
            displayErrorMessage();
            return;
        }

        const subscriptionData = subscriptionDoc.data();

        // Verify the subscription status and plan
        if (
            subscriptionData &&
            subscriptionData.plan &&
            (subscriptionData.plan === 'Monthly Pro' || subscriptionData.plan === 'Yearly Pro') &&
            subscriptionData.status === 'active'
        ) {
            // Update user's currentSubscription field if not already updated
            await userDocRef.update({
                currentSubscription: subscriptionData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Subscription activated for userId: ${user.uid}, subscriptionId: ${subscriptionId}, plan: ${subscriptionData.plan}`);

            // Show success message
            showSuccessMessage(subscriptionData.plan);
        } else {
            console.error('Subscription verification failed. Status not active or plan invalid.');
            displayErrorMessage();
        }
    } catch (error) {
        console.error('Error updating user subscription:', error);
        displayErrorMessage();
    }
}

// Function to show success message
function showSuccessMessage(planType) {
    const successMessageDiv = document.getElementById('successMessage');
    const subscribedPlanSpan = document.getElementById('subscribedPlan');

    subscribedPlanSpan.textContent = planType === 'Monthly Pro' ? 'Monthly' : 'Yearly';

    successMessageDiv.style.display = 'block';

    // Optionally, hide the subscription options and action buttons
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

    // Optionally, hide the subscription options and action buttons
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

// Function to redirect to course-selection.html
function redirectToCourseSelection() {
    window.location.href = '/course-selection.html';
}

// Function to continue with the free plan
function continueFree() {
    window.location.href = '/course-selection.html';
}

// Function to exit the upgrade page
function exitUpgrade() {
    window.location.href = '/course-selection.html';
}

// Logout function (reuse from course-selection.js)
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = '/';
    }).catch((error) => {
        console.error("Logout failed: ", error);
    });
}
