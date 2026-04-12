package com.infratech.guestboard.ui.welcome

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.Space
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CenterCrop
import com.bumptech.glide.load.resource.bitmap.RoundedCorners
import com.infratech.guestboard.R
import com.infratech.guestboard.data.model.DisplayPayload
import com.infratech.guestboard.data.model.RecommendationInfo
import kotlinx.coroutines.launch

class NearbyTabFragment : Fragment() {
    private val viewModel: WelcomeViewModel by activityViewModels()

    private val categoryLabels = mapOf(
        "restaurant" to "Restaurants",
        "bar" to "Bars",
        "coffee" to "Coffee",
        "park" to "Parks",
        "things_to_do" to "Things to Do",
        "shopping" to "Shopping"
    )

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_tab_nearby, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    if (state is DisplayUiState.Loaded) bindData(view, state.payload)
                }
            }
        }
    }

    private fun bindData(view: View, payload: DisplayPayload) {
        val container = view.findViewById<LinearLayout>(R.id.nearby_content)
        val emptyMsg = view.findViewById<TextView>(R.id.empty_message)

        val recs = payload.recommendations
        if (!payload.settings.showRecommendations || recs.isNullOrEmpty()) {
            container.visibility = View.GONE
            emptyMsg.visibility = View.VISIBLE
            return
        }

        container.visibility = View.VISIBLE
        emptyMsg.visibility = View.GONE
        container.removeAllViews()

        val accentColor = try {
            Color.parseColor(payload.settings.accentColor)
        } catch (_: Exception) {
            resources.getColor(R.color.accent, null)
        }

        val grouped = recs.groupBy { it.category }
        grouped.forEach { (category, items) ->
            // Glass section wrapper
            val section = LinearLayout(requireContext()).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundResource(R.drawable.bg_frosted_card)
                setPadding(24, 20, 24, 20)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    if (container.childCount > 0) topMargin = 16
                }
            }

            // Category header
            val header = TextView(requireContext()).apply {
                text = categoryLabels[category] ?: category.replaceFirstChar { it.uppercase() }
                setTextColor(accentColor)
                textSize = 18f
                setTypeface(null, android.graphics.Typeface.BOLD)
                setPadding(0, 0, 0, 12)
            }
            section.addView(header)

            // Lay out items in rows of 3
            val chunked = items.chunked(3)
            for (chunk in chunked) {
                val row = LinearLayout(requireContext()).apply {
                    orientation = LinearLayout.HORIZONTAL
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply { bottomMargin = 12 }
                }

                for (i in 0 until 3) {
                    if (i < chunk.size) {
                        val card = createCard(chunk[i], accentColor)
                        val params = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f)
                        if (i < 2) params.marginEnd = 12
                        card.layoutParams = params
                        row.addView(card)
                    } else {
                        val spacer = Space(requireContext())
                        spacer.layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f)
                        row.addView(spacer)
                    }
                }

                section.addView(row)
            }

            container.addView(section)
        }
    }

    private fun createCard(rec: RecommendationInfo, accentColor: Int): View {
        val card = LayoutInflater.from(requireContext())
            .inflate(R.layout.item_nearby_card, null, false)

        val photo = card.findViewById<ImageView>(R.id.rec_photo)
        val name = card.findViewById<TextView>(R.id.rec_name)
        val rating = card.findViewById<TextView>(R.id.rec_rating)
        val subtitle = card.findViewById<TextView>(R.id.rec_subtitle)
        val hostNote = card.findViewById<TextView>(R.id.rec_host_note)

        name.text = rec.name

        if (!rec.photoUrl.isNullOrBlank()) {
            Glide.with(this)
                .load(rec.photoUrl)
                .transform(CenterCrop(), RoundedCorners(16))
                .into(photo)
        }

        if (rec.rating != null) {
            rating.visibility = View.VISIBLE
            rating.text = String.format("%.1f \u2605  ", rec.rating)
        }

        subtitle.text = rec.address.ifBlank { rec.description }

        if (!rec.hostNote.isNullOrBlank()) {
            hostNote.visibility = View.VISIBLE
            hostNote.text = "\u201C${rec.hostNote}\u201D"
            hostNote.setTextColor(accentColor)
        }

        return card
    }
}
