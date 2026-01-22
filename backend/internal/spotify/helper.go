package spotify

func batchTrackIDs(trackIDs []string, batchSize int) [][]string {
	var chunks [][]string
	for i := 0; i < len(trackIDs); i += batchSize {
		end := i + batchSize
		if end > len(trackIDs) {
			end = len(trackIDs)
		}
		chunks = append(chunks, trackIDs[i:end])
	}
	return chunks
}

func extractTrackIDs(tracks []SpotifyTrack) []string {
	ids := make([]string, 0, len(tracks))
	for _, t := range tracks {
		ids = append(ids, t.ID)
	}
	return ids
}