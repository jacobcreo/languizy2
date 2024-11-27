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
                    // Note: Not prepopulating firstName and lastName as per requirements
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

        // Determine the plan type based on the orderReference or additional data if available
        // For simplicity, let's assume the plan type is encoded in the order ID or use a separate field
        // You might need to adjust this based on your FastSpring setup

        // Here, we will assume that the 'product' is identifiable via the orderReference
        // For demonstration, let's fetch the product details from FastSpring API or include it in the webhook

        // **Note:** In a production environment, you should verify the order on the server side using FastSpring's API

        // For now, we'll simulate the plan type
        const planType = determinePlanType(subscriptionId);

        // Prepare subscription data
        const subscriptionData = {
            subscriptionId: subscriptionId,
            userId: user.uid,
            productId: planType === 'monthly' ? 'monthly-pro' : 'yearly-pro',
            plan: planType === 'monthly' ? 'Monthly' : 'Yearly',
            status: 'active',
            startDate: new Date(), // Current date
            nextBillingDate: planType === 'monthly' ?
                new Date(new Date().setMonth(new Date().getMonth() + 1)) :
                new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Update subscriptions collection
        await db.collection('subscriptions').doc(subscriptionId).set(subscriptionData, { merge: true });

        // Update user's currentSubscription field
        await userDocRef.update({
            currentSubscription: subscriptionData,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Subscription activated for userId: ${user.uid}, subscriptionId: ${subscriptionId}, plan: ${subscriptionData.plan}`);

        // Show success message
        showSuccessMessage(subscriptionData.plan);
    } catch (error) {
        console.error('Error updating user subscription:', error);
        alert('There was an issue processing your subscription. Please contact support.');
    }
}

// Function to determine plan type based on subscriptionId
// **Adjust this function based on how you identify plan types from orderReference**
function determinePlanType(subscriptionId) {
    // Example logic: if subscriptionId contains 'monthly', it's monthly; otherwise, yearly
    // Adjust according to your FastSpring configuration
    if (subscriptionId.includes('monthly')) {
        return 'monthly';
    } else if (subscriptionId.includes('yearly')) {
        return 'yearly';
    } else {
        // Default to monthly if undetermined
        return 'monthly';
    }
}

// Function to show success message
function showSuccessMessage(planType) {
    const successMessageDiv = document.getElementById('successMessage');
    const subscribedPlanSpan = document.getElementById('subscribedPlan');

    subscribedPlanSpan.textContent = planType === 'monthly' ? 'Monthly' : 'Yearly';

    successMessageDiv.style.display = 'block';

    // Optionally, hide the subscription options
    const subscriptionOptions = document.querySelector('.row.justify-content-center');
    if (subscriptionOptions) {
        subscriptionOptions.style.display = 'none';
    }

    // Optionally, hide the action buttons
    const actionButtons = document.querySelector('.text-center.mt-4');
    if (actionButtons) {
        actionButtons.style.display = 'none';
    }
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
