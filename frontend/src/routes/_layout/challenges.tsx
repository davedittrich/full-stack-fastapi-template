import { Box, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/challenges")({
  component: Challenges,
})

function Challenges() {
  return (
    <Box>
      <Heading size="lg" textAlign="center" py={12}>
        Challenges
      </Heading>
      <Text textAlign="center" color="gray.500">
        Challenge management interface coming soon...
      </Text>
      <Text textAlign="center" mt={4} fontSize="sm" color="gray.400">
        This page will allow you to view and manage educational challenges.
      </Text>
    </Box>
  )
}

export default Challenges