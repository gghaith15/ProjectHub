import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { Timestamp } from '@firebase/firestore-types'; // Import Timestamp type from Firestore
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NavigationProp } from '@react-navigation/native';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

interface ProjectData {
  projectName: string;
  projectDescription: string;
  startDate: Timestamp;
  endDate: Timestamp;
  priority: string;
  assignedMembers: AssignedMember[];
}

interface AssignedMember {
  name: string;
  profilePhoto?: string;
}

interface ProjectComponentProps extends RouterProps, ProjectData {
  projectId: string;
  projectName: string;
  projectDescription: string;
  startDate: Timestamp;
  endDate: Timestamp;
  priority: string;
  assignedMembers: AssignedMember[];
  navigation: any; // Update this type based on your navigation prop type
}

const ProjectComponent: React.FC<ProjectComponentProps> = ({ projectId, projectName, projectDescription, startDate, endDate, priority, assignedMembers, navigation }) => {
  const formatDate = (date: Timestamp | undefined): string => {
    const formattedDate = new Date(date.seconds * 1000);
    return formattedDate.toLocaleDateString();
  };
  // console.log("assignedMembers", assignedMembers);

  const truncateDescription = (description: string, maxLength: number): string => {
    if (description.length > maxLength) {
      return `${description.substring(0, maxLength)}...`;
    }
    return description;
  };

  const truncateTitle = (Title: string, maxLength: number): string => {
    if (Title.length > maxLength) {
      return `${Title.substring(0, maxLength)}...`;
    }
    return Title;
  };

  const getRandomColor = (): string => {
    const colors = ['#fff']; // Array of color codes
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  const backgroundColor = getRandomColor(); // Get a random color for the background

  const handlePress = () => {
    navigation.navigate('Project Details', {
      project: {
        projectId,
        projectName,
        projectDescription,
        startDate,
        endDate,
        priority,
        assignedMembers,
      }
    });
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF6347'; // Red color for High priority
      case 'medium':
        return '#FFC047'; // Yellow color for Medium priority
      case 'low':
        return '#62CF2F'; // Green color for Low priority
      default:
        return '#C5C2FF'; // Default color
    }
  };

  const getPriorityContainerWidth = (priority: string): number => {
    const textLength = priority.length * 10.8; // Assuming 10.8 is the average width of a character
    const minWidth = 30; // Minimum width
    return textLength + 20; // Adding some extra padding for better visibility
  };
  
  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={styles.title}>{truncateTitle(projectName ?? "no title", 29)}</Text>


        <View style={styles.DateContainer}>
          <Text>{startDate?.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) || "no date"}</Text>
          <Text> to </Text>
          <Text>{endDate?.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) || "no date"}</Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text>Description: {truncateDescription(projectDescription ?? "no description", 120)}</Text>
        </View>

        <View style={styles.bottomContainer}>

          <View style={[styles.priorityContainer, { backgroundColor: getPriorityColor(priority), width: getPriorityContainerWidth(priority) }]}>
            <Text style={styles.priorityText}>{priority.toUpperCase()}</Text>
          </View>

          <View style={styles.memberContainer}>
            
            {assignedMembers.slice(0, 2).map((member, index) => {
              // console.log('====================================');
              // console.log(member.profilePhoto);
              // console.log('====================================');
              return <View key={index} style={styles.memberCircle}>
                {member.profilePhoto ? (
                  <Image source={{ uri: member.profilePhoto }} style={styles.profilePhoto} />
                ) : (
                  <Text style={styles.memberInitial}>{member.name?.charAt(0).toUpperCase() ?? ''}</Text>
                )}
              </View>
            })}
            {assignedMembers.length > 2 && (
              <View style={[styles.memberCircle, styles.memberCountCircle]}>
                <Text style={styles.memberCountText}>+{assignedMembers.length - 2}</Text>
              </View>
            )}

          </View>

        </View>

      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    width: 400,
    padding: 20,
    borderRadius: 25,
    margin: 5,
    height: 260,
    marginTop: -115,
  },

  title: {
    fontSize: 24,
    color: "black",
    fontWeight: 'bold',
    marginBottom: 5,
  },

  DateContainer: {
    // display: 'flex',
    flexDirection: 'row',
    marginTop: 20,
  },

  descriptionContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    height: 90,

  },

  bottomContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20, // Align with bottom
    left: 20, // Add some left padding
    height: 45,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },

  priorityContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    minWidth: 50, // Set a default minWidth
  },

  priorityText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  memberContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 5,
    paddingHorizontal: 10,
    minWidth: 50, // Set a default minWidth

  },

  memberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C9EF76',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 2,
    marginBottom: 20, // Adjust this value to control the overlap
    marginRight: -15, // Adjust this value to control the horizontal spacing between circles
  },

  memberInitial: {
    fontSize: 18,
    color: '#0d0d0d',
  },

  memberCountCircle: {
    backgroundColor: '#0d0d0d', // Different color for the count circle
  },

  memberCountText: {
    color: '#fff',
    fontSize: 16,
  },

  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

});

export default ProjectComponent;
