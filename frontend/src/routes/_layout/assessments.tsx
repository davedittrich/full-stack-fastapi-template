import { Box, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/assessments")({
  component: Assessments,
})

function Assessments() {
  return (
    <Box>
      <Heading size="lg" textAlign="center" py={12}>
        Assessments
      </Heading>
      <Text textAlign="center" color="gray.500">
        Assessment management interface for quiz-style questions with scoring.
      </Text>
      <Text textAlign="center" mt={4} fontSize="sm" color="gray.400">
        This page will allow lecturers and admins to create and manage assessments, and students to take quizzes.
      </Text>
    </Box>
  )
}

export default Assessments